"""
E2E 端测脚本 — 直接模拟 main.py 的完整任务处理流程
无需启动长跑进程，单次执行后退出，便于验证。

Usage:
    python _run_e2e_test.py
"""
import os
import sys
import time
import logging
from datetime import datetime, timezone

# 强制 Mock 模式
os.environ["USE_MOCK_CREW"] = "true"
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
logger = logging.getLogger("e2e_test")

TASK_ID = "d9901803-2087-4df0-9520-bac6dd09900d"
USER_ID = "12a67bd2-b637-48b9-b3c7-9f100f0b6071"

# ── Step 1: Reset task to pending ──────────────────────────────────────────
print("\n" + "="*60)
print("STEP 1: Reset task to pending")
print("="*60)

import psycopg2
from psycopg2.extras import RealDictCursor

DSN = os.environ["DATABASE_URL"]
conn = psycopg2.connect(DSN)
cur = conn.cursor()
cur.execute(
    "UPDATE backlink_tasks SET status='pending', retry_count=0, "
    "error_message=NULL, worker_id=NULL, screenshot_url=NULL, live_url=NULL "
    "WHERE id=%s",
    (TASK_ID,)
)
cur.execute(
    "UPDATE users SET credit_balance=10 WHERE id=%s",
    (USER_ID,)
)
conn.commit()
cur.execute("SELECT status, retry_count, credit_balance FROM backlink_tasks t "
            "JOIN users u ON t.user_id=u.id::text WHERE t.id=%s", (TASK_ID,))
row = cur.fetchone()
conn.close()
print(f"[OK] Task status={row[0]}, retry={row[1]}, credits={row[2]}")

# ── Step 2: fetch_next_job ──────────────────────────────────────────────────
print("\n" + "="*60)
print("STEP 2: fetch_next_job")
print("="*60)

from db_connector import get_connection, fetch_next_job, start_processing, mark_success, mark_failed_and_refund

conn2 = get_connection()
job_row = fetch_next_job(conn2)
conn2.close()

if not job_row:
    print("[FAIL] No job returned! Check DB query.")
    sys.exit(1)

print(f"[OK] Job fetched:")
for k, v in job_row.items():
    print(f"     {k:25} = {v}")

# ── Step 3: Mock Crew run ───────────────────────────────────────────────────
print("\n" + "="*60)
print("STEP 3: MockBacklinkCrew.run()  (15-30s simulated work)")
print("="*60)

from dataclasses import dataclass
from typing import Optional

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

from mock_crew import MockBacklinkCrew

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

# Deduct credit + mark processing
conn3 = get_connection()
start_processing(conn3, job.task_id, job.user_id)
conn3.close()
print("[OK] Credit deducted, status=processing")

crew = MockBacklinkCrew(job=job)
print("[INFO] Running mock crew (this takes 15-30 seconds)...")
t0 = time.time()
result = crew.run()
duration = time.time() - t0
print(f"[OK] Crew finished in {duration:.1f}s | status={result.status}")

# ── Step 4: Write result to DB ──────────────────────────────────────────────
print("\n" + "="*60)
print("STEP 4: Write result to DB")
print("="*60)

conn4 = get_connection()

if result.status == "success":
    # Skip Cloudinary upload (placeholder creds), use mock URL
    screenshot_url = "https://res.cloudinary.com/demo/image/upload/v1/mock_proof.png"
    mark_success(conn4, task_id=job.task_id, screenshot_url=screenshot_url, live_link_url=result.live_url)
    print(f"[OK] Marked SUCCESS | live_url={result.live_url} | screenshot={screenshot_url}")

elif result.status == "need_2fa":
    # Refund credit and pause task
    with conn4.cursor() as cur:
        cur.execute("UPDATE backlink_tasks SET status='need_2fa', updated_at=NOW() WHERE id=%s", (job.task_id,))
        cur.execute("UPDATE users SET credit_balance=credit_balance+1 WHERE id=%s::uuid", (job.user_id,))
    conn4.commit()
    print(f"[OK] Marked NEED_2FA | message={result.twofa_message}")

else:
    mark_failed_and_refund(conn4, task_id=job.task_id, user_id=job.user_id, error_msg=result.error_message or "mock failure")
    print(f"[WARN] Marked FAILED | error={result.error_message}")

conn4.close()

# ── Step 5: Verify final state ──────────────────────────────────────────────
print("\n" + "="*60)
print("STEP 5: Verify final state in DB")
print("="*60)

conn5 = psycopg2.connect(DSN)
cur5 = conn5.cursor()
cur5.execute(
    "SELECT t.id, t.status, t.retry_count, t.live_url, t.screenshot_url, "
    "t.error_message, t.updated_at, u.credit_balance "
    "FROM backlink_tasks t JOIN users u ON t.user_id=u.id::text "
    "WHERE t.id=%s",
    (TASK_ID,)
)
final = cur5.fetchone()
conn5.close()

if final:
    print(f"  task_id      = {final[0]}")
    print(f"  status       = {final[1]}")
    print(f"  retry_count  = {final[2]}")
    print(f"  live_url     = {final[3]}")
    print(f"  screenshot   = {final[4]}")
    print(f"  error_msg    = {final[5]}")
    print(f"  updated_at   = {final[6]}")
    print(f"  credits left = {final[7]}")
    print()
    if final[1] == "success":
        print("[PASS] ✓ pending -> processing -> success  VERIFIED")
    elif final[1] == "need_2fa":
        print("[PASS] ✓ pending -> processing -> need_2fa  VERIFIED")
    else:
        print(f"[INFO] Final status: {final[1]}")
else:
    print("[FAIL] Could not read final state")

print("\n" + "="*60)
print("E2E TEST COMPLETE")
print("="*60)





