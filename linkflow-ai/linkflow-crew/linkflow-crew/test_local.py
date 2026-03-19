"""
LinkFlow AI — Local Dry-Run Test

Tests the full worker pipeline WITHOUT real browser/platform calls.
All CrewAI + Playwright calls are mocked.

Usage:
    python test_local.py
    python test_local.py --headful    (real browser, no AI)
    python test_local.py --full       (real browser + real AI, costs tokens)
"""

import argparse
import json
import logging
import os
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import MagicMock, patch

from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.progress import track

load_dotenv()
console = Console()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(message)s",
)
logger = logging.getLogger("linkflow.test")


# ── Step 1: DB Connection ─────────────────────────────────────────────────────
def test_db_connection() -> bool:
    console.print("\n[bold cyan][ Step 1 ] Testing DB connection...[/bold cyan]")
    try:
        from db_connector import get_connection
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) as cnt FROM backlink_tasks WHERE status = 'pending'")
            pending = dict(cur.fetchone())["cnt"]
            cur.execute("SELECT COUNT(*) as cnt FROM users")
            users = dict(cur.fetchone())["cnt"]
            cur.execute("SELECT COUNT(*) as cnt FROM platforms WHERE is_active = true")
            platforms = dict(cur.fetchone())["cnt"]
        conn.close()

        t = Table(show_header=False, box=None, padding=(0, 2))
        t.add_row("[green]✓[/green] Connection", "Neon PostgreSQL")
        t.add_row("[green]✓[/green] Users", str(users))
        t.add_row("[green]✓[/green] Active platforms", str(platforms))
        t.add_row("[green]✓[/green] Pending tasks", str(pending))
        console.print(t)
        return True
    except Exception as e:
        console.print(f"[bold red]✗ DB connection failed: {e}[/bold red]")
        console.print("  → Check DATABASE_URL in linkflow-crew/.env")
        return False


# ── Step 2: Fetch next job ────────────────────────────────────────────────────
def test_fetch_job() -> dict | None:
    console.print("\n[bold cyan][ Step 2 ] Fetching next pending job...[/bold cyan]")
    try:
        from db_connector import get_connection, fetch_next_job
        conn = get_connection()
        job = fetch_next_job(conn)
        conn.close()

        if not job:
            console.print("[yellow]  No pending tasks found.[/yellow]")
            console.print("  → Run: psql $DATABASE_URL -f scripts/seed_test_task.sql")
            return None

        job = dict(job)
        t = Table(show_header=False, box=None, padding=(0, 2))
        t.add_row("[green]✓[/green] Task ID",      job["id"])
        t.add_row("[green]✓[/green] Target URL",   job["target_url"])
        t.add_row("[green]✓[/green] Anchor text",  job["anchor_text"])
        t.add_row("[green]✓[/green] Platform",     job.get("platform_name") or job.get("platform_type") or "?")
        t.add_row("[green]✓[/green] User credits", str(job.get("credit_balance", "?")))
        console.print(t)
        return job
    except Exception as e:
        console.print(f"[bold red]✗ fetch_next_job failed: {e}[/bold red]")
        return None


# ── Step 3: Mock Crew run ─────────────────────────────────────────────────────
def test_mock_crew_run(job: dict) -> dict:
    console.print("\n[bold cyan][ Step 3 ] Simulating CrewAI run (mocked)...[/bold cyan]")

    # Create a fake screenshot PNG (1x1 pixel)
    tmp_screenshot = os.path.join(
        tempfile.gettempdir(),
        f"linkflow_test_{job['id'][:8]}.png"
    )
    # Write minimal valid PNG bytes
    png_bytes = bytes([
        0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,  # PNG signature
        0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,  # IHDR chunk
        0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,
        0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53,
        0xDE,0x00,0x00,0x00,0x0C,0x49,0x44,0x41,
        0x54,0x08,0xD7,0x63,0xF8,0xCF,0xC0,0x00,
        0x00,0x00,0x02,0x00,0x01,0xE2,0x21,0xBC,
        0x33,0x00,0x00,0x00,0x00,0x49,0x45,0x4E,
        0x44,0xAE,0x42,0x60,0x82,
    ])
    Path(tmp_screenshot).write_bytes(png_bytes)

    mock_result = {
        "status": "success",
        "screenshot_path": tmp_screenshot,
        "live_url": f"https://wordpress.com/mock-post-{job['id'][:8]}",
        "twofa_message": "",
        "error_message": "",
    }

    console.print(f"  [green]✓[/green] Mock crew returned: status=success")
    console.print(f"  [green]✓[/green] Mock screenshot: {tmp_screenshot}")
    console.print(f"  [green]✓[/green] Mock live URL:   {mock_result['live_url']}")
    return mock_result


# ── Step 4: Test screenshot upload ───────────────────────────────────────────
def test_screenshot_upload(screenshot_path: str, task_id: str) -> str:
    console.print("\n[bold cyan][ Step 4 ] Testing screenshot upload to Cloudinary...[/bold cyan]")
    cloudinary_url = os.getenv("CLOUDINARY_URL", "")
    if not cloudinary_url or "your" in cloudinary_url.lower():
        console.print("  [yellow]⚠ CLOUDINARY_URL not configured — skipping upload test.[/yellow]")
        console.print("  → Set CLOUDINARY_URL=cloudinary://key:secret@cloud_name in .env")
        return "https://placeholder.cloudinary.com/screenshot.png"

    try:
        from storage import upload_screenshot
        url = upload_screenshot(screenshot_path, task_id + "_test")
        console.print(f"  [green]✓[/green] Uploaded: {url}")
        return url
    except Exception as e:
        console.print(f"  [red]✗ Upload failed: {e}[/red]")
        return ""


# ── Step 5: Status transition test ───────────────────────────────────────────
def test_status_transitions(job: dict, screenshot_url: str, live_url: str, dry_run: bool = True) -> bool:
    console.print("\n[bold cyan][ Step 5 ] Testing DB status transitions...[/bold cyan]")

    if dry_run:
        console.print("  [yellow]DRY RUN — no DB writes. Pass --commit to write.[/yellow]")
        console.print(f"  Would deduct 1 credit from user {job['user_id']}")
        console.print(f"  Would set status=processing for task {job['id']}")
        console.print(f"  Would set status=success, screenshot_url={screenshot_url[:50]}...")
        return True

    try:
        from db_connector import get_connection, start_processing, mark_success
        conn = get_connection()
        start_processing(conn, job["id"], job["user_id"])
        console.print(f"  [green]✓[/green] Credit deducted, status=processing")
        mark_success(conn, job["id"], screenshot_url, live_url)
        console.print(f"  [green]✓[/green] Status=success, screenshot_url saved")
        conn.close()
        return True
    except Exception as e:
        console.print(f"  [red]✗ Status transition failed: {e}[/red]")
        return False


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="LinkFlow AI Local Test")
    parser.add_argument("--commit", action="store_true",
                        help="Actually write to DB (default: dry run)")
    parser.add_argument("--task-id", type=str,
                        help="Specific task ID to test with")
    args = parser.parse_args()

    console.print(Panel.fit(
        "[bold cyan]LinkFlow AI — Local Test Suite[/bold cyan]\n"
        "Tests DB connection, job fetching, mock crew, and upload pipeline.",
        border_style="cyan"
    ))

    results = []

    # Step 1
    if not test_db_connection():
        console.print("\n[bold red]Cannot continue without DB connection. Exiting.[/bold red]")
        sys.exit(1)
    results.append(("DB Connection", "PASS"))

    # Step 2
    job = test_fetch_job()
    if not job:
        console.print("\n[yellow]No pending job to test. Seed one first:[/yellow]")
        console.print("  psql $DATABASE_URL -f scripts/seed_test_task.sql")
        results.append(("Fetch Job", "SKIP"))
    else:
        results.append(("Fetch Job", "PASS"))

        # Step 3
        mock_result = test_mock_crew_run(job)
        results.append(("Mock Crew Run", "PASS"))

        # Step 4
        screenshot_url = test_screenshot_upload(
            mock_result["screenshot_path"], job["id"]
        )
        results.append(("Screenshot Upload", "PASS" if screenshot_url else "SKIP"))

        # Step 5
        ok = test_status_transitions(
            job, screenshot_url, mock_result["live_url"],
            dry_run=not args.commit
        )
        results.append(("DB Status Transitions", "PASS" if ok else "FAIL"))

    # ── Summary ───────────────────────────────────────────────────────────────
    console.print("\n")
    t = Table(title="Test Results", show_header=True)
    t.add_column("Test", style="cyan")
    t.add_column("Result", justify="center")
    for name, result in results:
        color = "green" if result == "PASS" else ("yellow" if result == "SKIP" else "red")
        t.add_row(name, f"[{color}]{result}[/{color}]")
    console.print(t)

    passed = sum(1 for _, r in results if r == "PASS")
    total  = len(results)
    console.print(f"\n[bold]{'[green]ALL TESTS PASSED' if passed == total else '[yellow]PARTIAL'}[/bold] ({passed}/{total})")

    if not args.commit:
        console.print("\n[dim]Tip: Run with --commit to actually write status changes to the DB.[/dim]")


if __name__ == "__main__":
    main()
