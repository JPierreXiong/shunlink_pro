import os
import sys
import json
import time
import threading
from pathlib import Path
from http.server import BaseHTTPRequestHandler, HTTPServer

from dotenv import load_dotenv
from sqlalchemy import text


env_path = Path("d:/AIsoftware/linkflow/shunlink_pro/ai_crew_linkflow_ai/linkflow-crew/.env")
load_dotenv(env_path)

# 用户提供的 Neon 连接串优先
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql://neondb_owner:npg_6r3PnCxiIbTt@ep-sweet-block-ah1rvh25-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require",
)

crew_root = "d:/AIsoftware/linkflow/shunlink_pro/ai_crew_linkflow_ai/linkflow-crew"
sys.path.append(crew_root)

import task_consumer as tc  # noqa: E402
from database import get_db  # noqa: E402


REQUEST_LOG = {}


class RefundHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length).decode("utf-8") if length > 0 else ""
        REQUEST_LOG["path"] = self.path
        REQUEST_LOG["headers"] = dict(self.headers)
        REQUEST_LOG["body"] = body

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"ok":true}')

    def log_message(self, format, *args):
        return


def has_col(session, col: str) -> bool:
    rows = session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='backlink_tasks'"))
    cols = {r[0] for r in rows.fetchall()}
    return col in cols


def pick_task_id(session) -> str:
    row = session.execute(text("SELECT id FROM backlink_tasks ORDER BY updated_at DESC NULLS LAST, created_at DESC LIMIT 1")).fetchone()
    if not row:
        raise RuntimeError("No task found in backlink_tasks")
    return str(row[0])


def reset_task(session, task_id: str):
    fields = {
        "status": "pending",
        "retry_count": 0,
        "error_message": None,
        "screenshot_url": None,
        "updated_at": text("NOW()"),
    }

    if has_col(session, "two_fa_code"):
        fields["two_fa_code"] = None
    if has_col(session, "twofa_code"):
        fields["twofa_code"] = None
    if has_col(session, "twofa_prompt"):
        fields["twofa_prompt"] = None
    if has_col(session, "two_fa_prompt"):
        fields["two_fa_prompt"] = None
    if has_col(session, "live_url"):
        fields["live_url"] = None
    if has_col(session, "live_link_url"):
        fields["live_link_url"] = None
    if has_col(session, "worker_id"):
        fields["worker_id"] = None

    set_clause = []
    params = {"task_id": task_id}
    for i, (k, v) in enumerate(fields.items()):
        key = f"v{i}"
        if isinstance(v, type(text("NOW()"))):
            set_clause.append(f"{k} = NOW()")
        else:
            set_clause.append(f"{k} = :{key}")
            params[key] = v

    session.execute(text(f"UPDATE backlink_tasks SET {', '.join(set_clause)} WHERE id=:task_id"), params)
    session.commit()


def get_snapshot(session, task_id: str):
    row = session.execute(text("""
        SELECT id, status, retry_count, error_message, worker_id, updated_at
        FROM backlink_tasks
        WHERE id=:task_id
    """), {"task_id": task_id}).fetchone()
    return dict(row._mapping)


def main():
    server = HTTPServer(("127.0.0.1", 18080), RefundHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    tc.VERCEL_APP_URL = "http://127.0.0.1:18080"
    tc.WORKER_SECRET = "integration-secret"

    with get_db() as session:
        task_id = pick_task_id(session)
        reset_task(session, task_id)
        print(f"[prep] task_id={task_id} reset to pending")

    with get_db() as session:
        task = tc.fetch_one_pending_task(session)

    if not task:
        raise RuntimeError("fetch_one_pending_task returned None")

    print(f"[worker] fetched task={task['id']} status locked to processing")

    original_run_agent = tc.run_agent

    def fake_run_agent(task_data, session):
        return {
            "status": "failed",
            "error_message": "invalid_credentials integration test",
            "agent_log": "forced permanent failure",
        }

    tc.run_agent = fake_run_agent

    try:
        tc.process_task(task)
        time.sleep(0.5)
    finally:
        tc.run_agent = original_run_agent
        server.shutdown()
        server.server_close()

    with get_db() as session:
        snap = get_snapshot(session, task_id)

    print("[result] task snapshot:")
    print(json.dumps(snap, default=str, ensure_ascii=False, indent=2))

    print("[result] refund api capture:")
    print(json.dumps({
        "received": bool(REQUEST_LOG),
        "path": REQUEST_LOG.get("path"),
        "x-worker-secret": REQUEST_LOG.get("headers", {}).get("x-worker-secret"),
        "body": REQUEST_LOG.get("body"),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()


