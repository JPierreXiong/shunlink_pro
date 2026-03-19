"""
LinkFlow AI — Worker Entry Point (v2)

All task state mutations (processing, success, failed, need_2fa, refund)
go through the Vercel API endpoints authenticated with x-worker-secret.
The worker NEVER writes status directly to Neon — only reads via
db_connector.fetch_next_job().

Flow per task:
  1. fetch_next_job()  — read pending task from Neon (SKIP LOCKED)
  2. PATCH /api/backlink/tasks/{id}  status=processing
  3. Run BacklinkCrew
  4a. Success  -> PATCH status=success + screenshotUrl + liveUrl
  4b. Need2FA  -> PATCH status=need_2fa
  4c. Failed   -> PATCH status=failed; if retries exhausted -> POST /refund

Run with:
    python main.py
"""

import logging
import os
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv
from rich.console import Console
from rich.logging import RichHandler

load_dotenv()

# Logging
log_level = os.getenv("WORKER_LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=log_level,
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler(rich_tracebacks=True)],
)
logger = logging.getLogger("linkflow.worker")
console = Console()

# Config
POLL_INTERVAL  = int(os.getenv("POLL_INTERVAL_SECONDS", "10"))
MAX_RETRIES    = int(os.getenv("MAX_RETRIES", "3"))
SWEEP_INTERVAL = 3600  # 1 hour

VERCEL_API_BASE = os.getenv("VERCEL_API_BASE", "").rstrip("/")
WORKER_SECRET   = os.getenv("WORKER_SECRET", "")

if not VERCEL_API_BASE:
    logger.error("VERCEL_API_BASE env var is required (e.g. https://www.linkflowai.app)")
    sys.exit(1)

# Imports after env loaded
from db_connector import (
    get_connection,
    fetch_next_job,
    sweep_expired_tasks,
    increment_platform_failure,
    reset_platform_failure,
)
from storage import upload_screenshot, cleanup_local_screenshot
from crew import BacklinkCrew, BacklinkJob
from src.tools.browser_tools import close_browser

LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)


def get_task_logger(task_id: str) -> logging.Logger:
    task_logger = logging.getLogger(f"linkflow.task.{task_id}")
    if task_logger.handlers:
        return task_logger
    task_logger.setLevel(logging.DEBUG)
    fh = logging.FileHandler(LOGS_DIR / f"{task_id}.log", encoding="utf-8")
    fh.setFormatter(logging.Formatter(
        "%(asctime)s | %(levelname)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    ))
    task_logger.addHandler(fh)
    task_logger.propagate = True
    return task_logger


# Vercel API helpers

def _headers() -> dict:
    return {
        "Content-Type": "application/json",
        "x-worker-secret": WORKER_SECRET,
    }


def patch_task(task_id: str, payload: dict, tlog=None) -> bool:
    """PATCH /api/backlink/tasks/{task_id} — returns True on success."""
    url = f"{VERCEL_API_BASE}/api/backlink/tasks/{task_id}"
    try:
        r = requests.patch(url, json=payload, headers=_headers(), timeout=30)
        if r.status_code == 200:
            return True
        msg = f"PATCH task failed [{r.status_code}]: {r.text[:200]}"
        (tlog or logger).error(msg)
        return False
    except Exception as e:
        (tlog or logger).error(f"PATCH task error: {e}")
        return False


def call_refund(task_id: str, tlog=None) -> bool:
    """POST /api/backlink/tasks/{task_id}/refund — returns True on success."""
    url = f"{VERCEL_API_BASE}/api/backlink/tasks/{task_id}/refund"
    try:
        r = requests.post(url, json={}, headers=_headers(), timeout=30)
        if r.status_code in (200, 201):
            return True
        msg = f"Refund failed [{r.status_code}]: {r.text[:200]}"
        (tlog or logger).error(msg)
        return False
    except Exception as e:
        (tlog or logger).error(f"Refund error: {e}")
        return False


# Job lifecycle

def build_job(row: dict) -> BacklinkJob:
    """Convert a DB row dict into a BacklinkJob dataclass."""
    return BacklinkJob(
        task_id=str(row["id"]),
        user_id=str(row["user_id"]),
        target_url=row["target_url"],
        anchor_text=row["anchor_text"],
        article_content="",  # ContentAgent generates from anchor_text
        platform_name=row.get("platform_name") or "Auto",
        platform_base_url=row.get("platform_base_url") or "",
        selector_config={},  # loaded by crew from platform_configs.json
        twofa_code=row.get("two_fa_code"),
    )


def process_job(row: dict) -> None:
    """
    Full lifecycle for one task.
    All DB writes go through Vercel API (PATCH + refund endpoints).
    """
    task_id     = str(row["id"])
    user_id     = str(row["user_id"])
    retry_cnt   = int(row.get("retry_count") or 0)
    platform_id = row.get("platform_id")

    tlog = get_task_logger(task_id)
    tlog.info(f"Picked up task (retry #{retry_cnt}) | user={user_id}")
    tlog.info(f"Target: {row.get('target_url')} | Anchor: {row.get('anchor_text')}")
    tlog.info(f"Platform: {row.get('platform_name', 'Auto')} | sla_due={row.get('sla_due')}")
    logger.info(f"[{task_id[:8]}] Claimed task")

    # Step 1: Mark processing
    if not patch_task(task_id, {"status": "processing"}, tlog):
        tlog.error("Could not mark processing — skipping task")
        return
    tlog.info("Status -> processing")

    # Step 2: Build + run crew
    result = None
    try:
        job = build_job(row)
        result = BacklinkCrew(job=job).run()
        tlog.info(f"Crew result: status={result.status} | {result.raw_output[:200]}")
        logger.info(f"[{task_id[:8]}] Crew: {result.status}")
    except Exception as e:
        tlog.error(f"Crew exception: {e}", exc_info=True)
        logger.error(f"[{task_id[:8]}] Crew exception: {e}")
        # Build a synthetic failed result
        from crew import CrewResult
        result = CrewResult(status="failed", error_message=str(e)[:500])
    finally:
        try:
            close_browser()
        except Exception:
            pass

    # Step 3: Handle result
    if result.status == "success":
        screenshot_url = ""
        if result.screenshot_path:
            try:
                screenshot_url = upload_screenshot(result.screenshot_path, task_id)
                cleanup_local_screenshot(result.screenshot_path)
                tlog.info(f"Screenshot uploaded: {screenshot_url}")
            except Exception as upload_err:
                tlog.warning(f"Screenshot upload failed: {upload_err}")

        # Write proof back via Vercel
        patch_task(task_id, {
            "status": "success",
            "screenshotUrl": screenshot_url,
            "liveUrl": result.live_url,
            "agentLog": _read_task_log(task_id),
        }, tlog)

        # Update platform stats
        if platform_id:
            conn = get_connection()
            try:
                reset_platform_failure(conn, platform_id)
            finally:
                conn.close()

        console.print(
            f"[bold green]SUCCESS[/bold green] Task {task_id[:8]} "
            f"| {result.live_url}"
        )

    elif result.status == "need_2fa":
        patch_task(task_id, {
            "status": "need_2fa",
            "errorMessage": result.twofa_message or "2FA required",
            "agentLog": _read_task_log(task_id),
        }, tlog)
        console.print(
            f"[bold yellow]NEED_2FA[/bold yellow] Task {task_id[:8]} "
            f"| {result.twofa_message}"
        )

    else:  # failed
        new_retry = retry_cnt + 1
        patch_task(task_id, {
            "status": "failed",
            "retryCount": new_retry,
            "errorMessage": result.error_message,
            "agentLog": _read_task_log(task_id),
        }, tlog)

        if platform_id:
            conn = get_connection()
            try:
                increment_platform_failure(conn, platform_id)
            finally:
                conn.close()

        if new_retry >= MAX_RETRIES:
            tlog.error(f"Task exhausted {MAX_RETRIES} retries — calling refund")
            call_refund(task_id, tlog)
            console.print(
                f"[bold red]FAILED[/bold red] Task {task_id[:8]} "
                f"(refunded) | {result.error_message}"
            )
        else:
            tlog.warning(
                f"Task failed (retry {new_retry}/{MAX_RETRIES}): "
                f"{result.error_message}"
            )
            console.print(
                f"[yellow]RETRY {new_retry}/{MAX_RETRIES}[/yellow] "
                f"Task {task_id[:8]} | {result.error_message}"
            )


def _read_task_log(task_id: str) -> str:
    """Read the per-task log file and return its contents (last 80 lines)."""
    log_path = LOGS_DIR / f"{task_id}.log"
    try:
        if log_path.exists():
            lines = log_path.read_text(encoding="utf-8").splitlines()
            return "\n".join(lines[-80:])
    except Exception:
        pass
    return ""


# Main poll loop

def run_worker() -> None:
    """Main entry point — runs forever until interrupted."""
    console.print(
        "[bold cyan]LinkFlow AI Worker v2[/bold cyan] starting...\n"
        f"  Vercel API   : {VERCEL_API_BASE}\n"
        f"  Poll interval: {POLL_INTERVAL}s\n"
        f"  Max retries  : {MAX_RETRIES}\n"
        f"  Log level    : {log_level}\n"
    )

    last_sweep = time.time()

    while True:
        loop_start = time.time()

        # Periodic expired-task sweep
        if loop_start - last_sweep >= SWEEP_INTERVAL:
            try:
                conn = get_connection()
                swept = sweep_expired_tasks(conn)
                conn.close()
                if swept:
                    logger.warning(f"Swept {swept} expired task(s)")
            except Exception as e:
                logger.error(f"Sweep error: {e}")
            last_sweep = loop_start

        # Fetch + process next job
        try:
            conn = get_connection()
            try:
                row = fetch_next_job(conn)
            finally:
                conn.close()

            if row:
                process_job(dict(row))
            else:
                elapsed = time.time() - loop_start
                time.sleep(max(0, POLL_INTERVAL - elapsed))

        except KeyboardInterrupt:
            console.print("\n[bold yellow]Worker stopped.[/bold yellow]")
            sys.exit(0)
        except Exception as e:
            logger.error(f"Poll loop error: {e}", exc_info=True)
            time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    run_worker()
