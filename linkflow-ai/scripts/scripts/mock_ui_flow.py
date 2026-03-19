"""
LinkFlow AI — UI Flow Simulator

Simulates the full task lifecycle in the database WITHOUT using
OpenAI tokens or a real browser. Lets you test all Vercel UI
animations and the 2FA human-in-loop flow.

Usage:
    python scripts/mock_ui_flow.py

Prerequisites:
    pip install psycopg2-binary python-dotenv
    DATABASE_URL must be set in .env

Flow:
    pending → processing → need_2fa → (wait for user) → processing → success
"""

import os
import sys
import time
import uuid
from pathlib import Path

# Load .env from linkflow-crew directory
env_path = Path(__file__).parent.parent / "linkflow-crew" / ".env"
if env_path.exists():
    from dotenv import load_dotenv
    load_dotenv(env_path)
else:
    print(f"[WARN] .env not found at {env_path}, using system env")

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    print("[ERROR] psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)

DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    print("[ERROR] DATABASE_URL not set.")
    sys.exit(1)


def conn():
    return psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)


def set_status(task_id: str, status: str, extra: dict = None):
    fields = {"status": status}
    if extra:
        fields.update(extra)

    set_clause = ", ".join(f"{k} = %s" for k in fields)
    values = list(fields.values()) + [task_id]

    c = conn()
    with c.cursor() as cur:
        cur.execute(f"UPDATE backlink_tasks SET {set_clause} WHERE id = %s", values)
    c.commit()
    c.close()
    print(f"  [DB] task {task_id[:8]}... → status='{status}'" +
          (f" | {extra}" if extra else ""))


def get_task(task_id: str) -> dict:
    c = conn()
    with c.cursor() as cur:
        cur.execute("SELECT * FROM backlink_tasks WHERE id = %s", (task_id,))
        row = cur.fetchone()
    c.close()
    return dict(row) if row else {}


def pick_or_create_task() -> str:
    """Use an existing pending task or prompt user for a task ID."""
    c = conn()
    with c.cursor() as cur:
        cur.execute(
            "SELECT id FROM backlink_tasks WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1"
        )
        row = cur.fetchone()
    c.close()

    if row:
        task_id = str(dict(row)["id"])
        print(f"\n[AUTO] Found pending task: {task_id}")
        use = input("  Use this task? [Y/n]: ").strip().lower()
        if use != "n":
            return task_id

    task_id = input("\nEnter Task ID from dashboard (or press Enter to skip): ").strip()
    if not task_id:
        print("[EXIT] No task ID provided.")
        sys.exit(0)
    return task_id


def mock_ui_flow(task_id: str):
    print(f"""
================================================================
  LinkFlow AI — UI Flow Simulator
  Task: {task_id}
  Watch your browser dashboard at http://localhost:3000
================================================================
""")

    # Step 1: processing
    print("[Step 1/5] Setting status → processing (watch card turn cyan)...")
    set_status(task_id, "processing")
    print("  Sleeping 5s — check dashboard...")
    time.sleep(5)

    # Step 2: simulate AI thinking
    print("\n[Step 2/5] Simulating AI work (15s)...")
    print("  TerminalLog component should be streaming fake log lines.")
    time.sleep(15)

    # Step 3: 2FA challenge
    print("\n[Step 3/5] Triggering 2FA challenge (watch card turn amber)...")
    set_status(task_id, "need_2fa", {
        "twofa_prompt": "[MOCK] Platform requires 2FA — enter the 6-digit code from your authenticator app."
    })

    print("\n  Go to your dashboard and enter any 6-digit code in the card.")
    print("  Waiting for twofa_code to appear in DB (polling every 3s)...")

    for _ in range(60):  # max 3 minutes
        task = get_task(task_id)
        code = task.get("twofa_code") or ""
        if code and code.strip():
            print(f"  [DB] Received 2FA code: {code} — resuming!")
            break
        time.sleep(3)
    else:
        print("  [TIMEOUT] No code received. Continuing anyway...")

    # Step 4: back to processing
    print("\n[Step 4/5] Code accepted — back to processing...")
    set_status(task_id, "processing", {"twofa_code": None, "twofa_prompt": None})
    time.sleep(8)

    # Step 5: success
    print("\n[Step 5/5] Marking SUCCESS (watch card turn green)...")
    set_status(task_id, "success", {
        "live_link_url": "https://mock-blogger.example.com/p/linkflow-test",
        "screenshot_url": "https://res.cloudinary.com/dhdqvckri/image/upload/v1/samples/landscapes/architecture-signs.jpg",
        "completed_at": "NOW()",
    })

    print("""
================================================================
  Simulation complete!
  Check your dashboard:
  - Card should be green with 'View Screenshot' + 'Live Link'
  - Screenshot modal should open the Cloudinary sample image
================================================================
""")


if __name__ == "__main__":
    task_id = pick_or_create_task()
    mock_ui_flow(task_id)

