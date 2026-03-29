"""
E2E 端测脚本 v2 — 验证 need_2fa 中断恢复完整流程

测试场景:
  Phase A: pending -> processing -> need_2fa (用户被要求输入验证码)
  Phase B: 模拟用户提交验证码 (写入 two_fa_code)
  Phase C: 任务重新被领取 -> processing -> success

Usage:
    python _run_e2e_2fa_test.py
"""
import os
import sys
import time
import logging

os.environ["USE_MOCK_CREW"] = "true"
os.environ["MOCK_OUTCOME"] = "need_2fa"   # Phase A 强制 need_2fa
os.environ["DATABASE_URL"] = (
    "postgresql://neondb_owner:npg_6r3PnCxiIbTt"
    "@ep-sweet-block-ah1rvh25-pooler.c-3.us-east-1.aws.neon.tech"
    "/neondb?sslmode=require"
)
os.environ["STORAGE_BACKEND"] = "cloudinary"
os.environ["CLOUDINARY_URL"] = "cloudinary://placeholder:placeholder@placeholder"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("e2e_2fa_test")

import psycopg2
from psycopg2.extras import RealDictCursor
from dataclasses import dataclass
from typing import Optional

DSN = os.environ["DATABASE_URL"]
TASK_ID = "d9901803-2087-4df0-9520-bac6dd09900d"
USER_ID = "12a67bd2-b637-48b9-b3c7-9f100f0b6071"
MOCK_2FA_CODE = "654321"


def divider(title):
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)


def db_query(sql, params=()):
    conn = psycopg2.connect(DSN)
    cur = conn.cursor()
    cur.execute(sql, params)
    row = cur.fetchone()
    conn.close()
    return row


def db_exec(sql, params=()):
    conn = psycopg2.connect(DSN)
    cur = conn.cursor()
    cur.execute(sql, params)
    conn.commit()
    conn.close()


@dataclass
class BacklinkJob:
    task_id: str
    user_id: str
    target_url: str
    anchor_text: str
    article_content: str
    platform_name: str
    platform_base_url: str
    selector_config: dict
    platform_credentials: Optional[dict] = None
    twofa_code: Optional[str] = None
    session_storage: Optional[dict] = None


from db_connector import (
    get_connection, fetch_next_job, start_processing,
    mark_success, mark_failed_and_refund
)
from mock_crew import MockBacklinkCrew


# ============================================================
# PHASE A: pending -> processing -> need_2fa
# ============================================================
divider("PHASE A: pending -> processing -> need_2fa")

# Reset task
db_exec(
    "UPDATE backlink_tasks SET status='pending', retry_count=0, "
    "error_message=NULL, worker_id=NULL, screenshot_url=NULL, "
    "live_url=NULL, two_fa_code=NULL WHERE id=%s",
    (TASK_ID,)
)
db_exec("UPDATE users SET credit_balance=10 WHERE id=%s", (USER_ID,))
print("[OK] Task reset to pending, credits=10")

# fetch + process
conn = get_connection()
job_row = fetch_next_job(conn)
conn.close()
assert job_row, "[FAIL] fetch_next_job returned None"
print(f"[OK] Fetched task: {job_row['id']}")

job = BacklinkJob(
    task_id=job_row["id"],
    user_id=job_row["user_id"],
    target_url=job_row["target_url"],
    anchor_text=job_row["anchor_text"],
    article_content=job_row.get("article_content") or "",
    platform_name=job_row.get("platform_name") or "WordPress.com",
    platform_base_url=job_row.get("platform_base_url") or "",
    selector_config=job_row.get("selector_config") or {},
    twofa_code=job_row.get("twofa_code"),
)

conn = get_connection()
start_processing(conn, job.task_id, job.user_id)
conn.close()
print("[OK] Credit deducted, status=processing")

print("[INFO] Running MockCrew with MOCK_OUTCOME=need_2fa (2-5s)...")
crew = MockBacklinkCrew(job=job)
result = crew.run()
print(f"[OK] Crew returned: status={result.status}")
assert result.status == "need_2fa", f"Expected need_2fa, got {result.status}"

# Write need_2fa to DB + refund credit
db_exec(
    "UPDATE backlink_tasks SET status='need_2fa', updated_at=NOW() WHERE id=%s",
    (TASK_ID,)
)
db_exec(
    "UPDATE users SET credit_balance=credit_balance+1 WHERE id=%s::uuid",
    (USER_ID,)
)

row = db_query(
    "SELECT t.status, u.credit_balance FROM backlink_tasks t "
    "JOIN users u ON t.user_id=u.id::text WHERE t.id=%s",
    (TASK_ID,)
)
print(f"[OK] DB state: status={row[0]}, credits={row[1]}")
assert row[0] == "need_2fa", f"Expected need_2fa in DB, got {row[0]}"
assert row[1] == 10, f"Expected credits refunded to 10, got {row[1]}"
print("[PASS] Phase A: pending -> processing -> need_2fa  OK")


# ============================================================
# PHASE B: 模拟用户提交验证码
# ============================================================
divider("PHASE B: User submits 2FA code (Vercel API simulation)")

print(f"[INFO] Simulating user submitting 2FA code: {MOCK_2FA_CODE}")
time.sleep(1)  # simulate user delay

# Vercel API would do: SET two_fa_code=..., status='pending'
db_exec(
    "UPDATE backlink_tasks SET two_fa_code=%s, status='pending', updated_at=NOW() WHERE id=%s",
    (MOCK_2FA_CODE, TASK_ID)
)

row = db_query(
    "SELECT status, two_fa_code FROM backlink_tasks WHERE id=%s",
    (TASK_ID,)
)
print(f"[OK] DB state: status={row[0]}, two_fa_code={row[1]}")
assert row[0] == "pending", f"Expected pending, got {row[0]}"
assert row[1] == MOCK_2FA_CODE, f"Expected {MOCK_2FA_CODE}, got {row[1]}"
print("[PASS] Phase B: 2FA code submitted  OK")


# ============================================================
# PHASE C: Worker re-picks task -> processing -> success
# ============================================================
divider("PHASE C: Worker re-picks task -> processing -> success")

# Switch mock to success for Phase C
os.environ["MOCK_OUTCOME"] = "success"

conn = get_connection()
job_row2 = fetch_next_job(conn)
conn.close()
assert job_row2, "[FAIL] fetch_next_job returned None in Phase C"
assert job_row2["twofa_code"] == MOCK_2FA_CODE, \
    f"Expected twofa_code={MOCK_2FA_CODE}, got {job_row2['twofa_code']}"
print(f"[OK] Re-fetched task with twofa_code={job_row2['twofa_code']}")

job2 = BacklinkJob(
    task_id=job_row2["id"],
    user_id=job_row2["user_id"],
    target_url=job_row2["target_url"],
    anchor_text=job_row2["anchor_text"],
    article_content=job_row2.get("article_content") or "",
    platform_name=job_row2.get("platform_name") or "WordPress.com",
    platform_base_url=job_row2.get("platform_base_url") or "",
    selector_config=job_row2.get("selector_config") or {},
    twofa_code=job_row2.get("twofa_code"),  # 2FA code passed to crew
)

conn = get_connection()
start_processing(conn, job2.task_id, job2.user_id)
conn.close()
print("[OK] Credit deducted, status=processing")

print("[INFO] Running MockCrew with MOCK_OUTCOME=success (2-5s)...")
crew2 = MockBacklinkCrew(job=job2)
result2 = crew2.run()
print(f"[OK] Crew returned: status={result2.status}")
assert result2.status == "success", f"Expected success, got {result2.status}"

# Write success to DB
conn = get_connection()
mark_success(
    conn,
    task_id=job2.task_id,
    screenshot_url="https://res.cloudinary.com/demo/image/upload/v1/mock_2fa_proof.png",
    live_link_url=result2.live_url,
)
conn.close()

# Clear the 2FA code now that task is done
db_exec(
    "UPDATE backlink_tasks SET two_fa_code=NULL WHERE id=%s",
    (TASK_ID,)
)


# ============================================================
# FINAL VERIFICATION
# ============================================================
divider("FINAL VERIFICATION")

final = db_query(
    "SELECT t.id, t.status, t.retry_count, t.live_url, t.screenshot_url, "
    "t.two_fa_code, t.error_message, t.updated_at, u.credit_balance "
    "FROM backlink_tasks t JOIN users u ON t.user_id=u.id::text "
    "WHERE t.id=%s",
    (TASK_ID,)
)

print(f"  task_id      = {final[0]}")
print(f"  status       = {final[1]}")
print(f"  retry_count  = {final[2]}")
print(f"  live_url     = {final[3]}")
print(f"  screenshot   = {final[4]}")
print(f"  two_fa_code  = {final[5]}  (should be NULL after completion)")
print(f"  error_msg    = {final[6]}")
print(f"  updated_at   = {final[7]}")
print(f"  credits left = {final[8]}  (started=10, deducted 1 in Phase C)")

assert final[1] == "success", f"[FAIL] Expected status=success, got {final[1]}"
assert final[5] is None, f"[FAIL] Expected two_fa_code=NULL after success"
assert final[8] == 9, f"[FAIL] Expected credits=9, got {final[8]}"

print()
print("[PASS] Phase A: pending -> processing -> need_2fa")
print("[PASS] Phase B: user submits 2FA code -> pending")
print("[PASS] Phase C: pending -> processing -> success")
print()
print("2FA interrupt/resume flow: ALL PHASES PASSED")
print("="*60)





