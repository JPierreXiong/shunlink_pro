import os
import time
from pathlib import Path
from datetime import datetime, timezone

from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor


def log(msg: str):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


def get_conn():
    env_path = Path("d:/AIsoftware/linkflow/shunlink_pro/ai_crew_linkflow_ai/linkflow-crew/.env")
    load_dotenv(env_path)
    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        raise RuntimeError("DATABASE_URL not found in .env")
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)


def resolve_fields(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='backlink_tasks'")
        cols = {r['column_name'] for r in cur.fetchall()}

    field_map = {
        "twofa_code": "two_fa_code" if "two_fa_code" in cols else "twofa_code",
        "twofa_prompt": "two_fa_prompt" if "two_fa_prompt" in cols else ("twofa_prompt" if "twofa_prompt" in cols else None),
        "live_url": "live_url" if "live_url" in cols else "live_link_url",
        "ai_log": "ai_thought" if "ai_thought" in cols else ("agent_log" if "agent_log" in cols else None),
        "has_completed_at": "completed_at" in cols,
        "has_screenshot_url": "screenshot_url" in cols,
        "has_error_message": "error_message" in cols,
        "has_updated_at": "updated_at" in cols,
    }

    required = ["twofa_code", "live_url"]
    for key in required:
        if not field_map.get(key) or field_map[key] not in cols:
            raise RuntimeError(f"required field missing: {key} -> {field_map.get(key)}")

    return field_map


def pick_task(conn):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT id, status, created_at
            FROM backlink_tasks
            WHERE status='pending'
            ORDER BY created_at ASC
            LIMIT 1
        """)
        row = cur.fetchone()
        if row:
            return str(row["id"]), "pending"

        cur.execute("""
            SELECT id, status, created_at
            FROM backlink_tasks
            ORDER BY created_at DESC
            LIMIT 1
        """)
        row = cur.fetchone()
        if row:
            return str(row["id"]), str(row["status"])

    raise RuntimeError("No task found in backlink_tasks")


def update_status(conn, task_id: str, status: str, extra: dict):
    fields = {"status": status, **extra}
    set_clause = ", ".join([f"{k}=%s" for k in fields.keys()])
    values = list(fields.values()) + [task_id]
    with conn.cursor() as cur:
        cur.execute(f"UPDATE backlink_tasks SET {set_clause} WHERE id=%s", values)
    conn.commit()


def fetch_snapshot(conn, task_id: str, fm: dict):
    twofa_prompt_select = (
        f"{fm['twofa_prompt']} AS twofa_prompt" if fm.get("twofa_prompt") else "NULL::text AS twofa_prompt"
    )
    screenshot_select = "screenshot_url" if fm.get("has_screenshot_url") else "NULL::text AS screenshot_url"
    error_select = "error_message" if fm.get("has_error_message") else "NULL::text AS error_message"
    updated_select = "updated_at" if fm.get("has_updated_at") else "NOW() AS updated_at"
    completed_select = "completed_at" if fm.get("has_completed_at") else "NULL::timestamptz AS completed_at"

    with conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT id, status, {fm['twofa_code']} AS twofa_code,
                   {twofa_prompt_select},
                   {fm['live_url']} AS live_url,
                   {screenshot_select}, {error_select}, {updated_select}, {completed_select}
            FROM backlink_tasks
            WHERE id=%s
            """,
            (task_id,),
        )
        return dict(cur.fetchone())


def main():
    conn = get_conn()
    try:
        fm = resolve_fields(conn)
        log(f"field map: {fm}")

        task_id, from_status = pick_task(conn)
        log(f"test task: {task_id} (original status={from_status})")

        log("Step 0: reset task -> pending")
        reset_payload = {
            fm["twofa_code"]: None,
            fm["live_url"]: None,
        }
        if fm.get("has_screenshot_url"):
            reset_payload["screenshot_url"] = None
        if fm.get("has_error_message"):
            reset_payload["error_message"] = None
        if fm.get("has_completed_at"):
            reset_payload["completed_at"] = None
        if fm.get("has_updated_at"):
            reset_payload["updated_at"] = datetime.now(timezone.utc)
        if fm.get("twofa_prompt"):
            reset_payload[fm["twofa_prompt"]] = None
        if fm.get("ai_log"):
            reset_payload[fm["ai_log"]] = "[MOCK-TEST] reset to pending"
        update_status(conn, task_id, "pending", reset_payload)

        log("Step 1: pending -> processing")
        step1_payload = {}
        if fm.get("has_updated_at"):
            step1_payload["updated_at"] = datetime.now(timezone.utc)
        if fm.get("ai_log"):
            step1_payload[fm["ai_log"]] = "[MOCK-TEST] processing started"
        update_status(conn, task_id, "processing", step1_payload)
        time.sleep(1)

        log("Step 2: processing -> need_2fa")
        step2_payload = {}
        if fm.get("has_error_message"):
            step2_payload["error_message"] = "Awaiting 2FA code from user"
        if fm.get("has_updated_at"):
            step2_payload["updated_at"] = datetime.now(timezone.utc)
        if fm.get("twofa_prompt"):
            step2_payload[fm["twofa_prompt"]] = "[MOCK-TEST] enter 6-digit OTP"
        if fm.get("ai_log"):
            step2_payload[fm["ai_log"]] = "[MOCK-TEST] waiting for 2FA"
        update_status(conn, task_id, "need_2fa", step2_payload)
        time.sleep(1)

        log("Step 3: simulate user 2FA backfill")
        step3_payload = {
            fm["twofa_code"]: "123456",
        }
        if fm.get("has_updated_at"):
            step3_payload["updated_at"] = datetime.now(timezone.utc)
        if fm.get("ai_log"):
            step3_payload[fm["ai_log"]] = "[MOCK-TEST] 2FA code received"
        update_status(conn, task_id, "need_2fa", step3_payload)

        snap = fetch_snapshot(conn, task_id, fm)
        log(f"2FA snapshot: status={snap['status']}, twofa_code={snap['twofa_code']}, twofa_prompt={snap['twofa_prompt']}")
        time.sleep(1)

        log("Step 4: need_2fa -> processing (consume code)")
        step4_payload = {
            fm["twofa_code"]: None,
        }
        if fm.get("has_error_message"):
            step4_payload["error_message"] = None
        if fm.get("has_updated_at"):
            step4_payload["updated_at"] = datetime.now(timezone.utc)
        if fm.get("twofa_prompt"):
            step4_payload[fm["twofa_prompt"]] = None
        if fm.get("ai_log"):
            step4_payload[fm["ai_log"]] = "[MOCK-TEST] resumed after 2FA"
        update_status(conn, task_id, "processing", step4_payload)
        time.sleep(1)

        log("Step 5: processing -> success")
        step5_payload = {
            fm["live_url"]: "https://mock-blogger.example.com/p/linkflow-test-e2e",
        }
        if fm.get("has_screenshot_url"):
            step5_payload["screenshot_url"] = "https://res.cloudinary.com/dhdqvckri/image/upload/v1/samples/landscapes/architecture-signs.jpg"
        if fm.get("has_error_message"):
            step5_payload["error_message"] = None
        if fm.get("has_completed_at"):
            step5_payload["completed_at"] = datetime.now(timezone.utc)
        if fm.get("has_updated_at"):
            step5_payload["updated_at"] = datetime.now(timezone.utc)
        if fm.get("ai_log"):
            step5_payload[fm["ai_log"]] = "[MOCK-TEST] completed"
        update_status(conn, task_id, "success", step5_payload)

        final = fetch_snapshot(conn, task_id, fm)
        log("Final snapshot:")
        for k in ["id", "status", "live_url", "screenshot_url", "error_message", "completed_at"]:
            log(f"  {k} = {final.get(k)}")

        log("DONE: mock flow + 2FA backfill + success writeback finished")

    finally:
        conn.close()


if __name__ == "__main__":
    main()

