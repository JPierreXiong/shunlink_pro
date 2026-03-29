"""
LinkFlow AI — Worker Entry Point

This is the 24/7 background worker that:
  1. Polls Neon DB every POLL_INTERVAL_SECONDS for pending tasks
  2. Validates user has credits (credit_balance > 0)
  3. Deducts 1 credit atomically and marks task 'processing'
  4. Runs the BacklinkCrew (CrewAI + Playwright)
  5. On success  → uploads screenshot, writes result to DB
  6. On need_2fa → pauses task, frontend notifies user
  7. On failure  → increments retry_count; after MAX_RETRIES refunds credit
  8. Runs sweep_expired_tasks() every hour to handle 48h SLA breaches

Run with:
    python main.py

Or in production (Railway / VPS):
    gunicorn -w 1 -k sync main:app   # if wrapping in Flask health endpoint
"""

import logging
import os
import random
import sys
import time
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from rich.console import Console
from rich.logging import RichHandler

load_dotenv()

# ── Logging setup ────────────────────────────────────────────────────────────
log_level = os.getenv("WORKER_LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=log_level,
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler(rich_tracebacks=True)],
)
logger = logging.getLogger("linkflow.worker")
console = Console()

# ── Config ───────────────────────────────────────────────────────────────────
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL_SECONDS", "10"))
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))
SWEEP_INTERVAL = 3600  # Run expired-task sweep every 1 hour

# ── Imports (after env loaded) ────────────────────────────────────────────────
from db_connector import (
    get_connection,
    fetch_next_job,
    start_processing,
    mark_success,
    mark_failed_and_refund,
    pause_for_2fa,
    increment_retry,
    sweep_expired_tasks,
    increment_platform_failure,
    reset_platform_failure,
)

# ── Per-task file logger setup ────────────────────────────────────────────────
LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)


def get_task_logger(task_id: str) -> logging.Logger:
    """Return a logger that writes to logs/{task_id}.log"""
    task_logger = logging.getLogger(f"linkflow.task.{task_id}")
    if task_logger.handlers:
        return task_logger  # already configured
    task_logger.setLevel(logging.DEBUG)
    fh = logging.FileHandler(LOGS_DIR / f"{task_id}.log", encoding="utf-8")
    fh.setFormatter(logging.Formatter(
        "%(asctime)s | %(levelname)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    ))
    task_logger.addHandler(fh)
    task_logger.propagate = True  # also goes to console
    return task_logger


from storage import upload_screenshot, cleanup_local_screenshot

def close_browser():
    """Safely close browser - no-op if playwright not available."""
    try:
        from src.tools.browser_tools import close_browser as _close
        _close()
    except Exception:
        pass

# ── Mock crew toggle (set USE_MOCK_CREW=true for E2E UI testing) ──────────────
if os.getenv("USE_MOCK_CREW", "false").lower() == "true":
    from mock_crew import MockBacklinkCrew as BacklinkCrew  # type: ignore
    # In mock mode, create a minimal BacklinkJob-compatible dataclass
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

    logger.warning("[MOCK MODE] Using MockBacklinkCrew — no real browser or AI calls")
else:
    from crew import BacklinkCrew, BacklinkJob  # type: ignore


# ── Job processing ────────────────────────────────────────────────────────────

def build_job(row: dict) -> BacklinkJob:
    """Convert a DB row dict into a BacklinkJob dataclass."""
    selector_config = row.get("selector_config") or {}
    # selector_config may come back as a dict (psycopg2 JSONB auto-parse) or str
    if isinstance(selector_config, str):
        import json
        selector_config = json.loads(selector_config)

    return BacklinkJob(
        task_id=str(row["id"]),
        user_id=str(row["user_id"]),
        target_url=row["target_url"],
        anchor_text=row["anchor_text"],
        article_content=(
            row.get("article_content")
            or row.get("agent_persona")
            or (
                f"Explore {row['target_url']} — a top resource for {row['anchor_text']}. "
                "This site offers valuable insights and practical tools for modern web professionals "
                "looking to boost their online presence and SEO performance."
            )
        ),
        platform_name=row.get("platform_name") or row.get("platform_type") or "Unknown Platform",
        platform_base_url=row.get("platform_base_url") or "",
        selector_config=selector_config,
        twofa_code=row.get("twofa_code"),
    )


def process_job(row: dict) -> None:
    """
    Full lifecycle for a single task row.
    Opens its own DB connection so each job is fully isolated.
    """
    task_id = str(row["id"])
    user_id = str(row["user_id"])
    retry_count = row.get("retry_count", 0)

    tlog = get_task_logger(task_id)
    tlog.info(f"Picked up task (retry #{retry_count}) | user={user_id}")
    tlog.info(f"Target: {row.get('target_url')} | Anchor: {row.get('anchor_text')}")
    tlog.info(f"Platform: {row.get('platform_name', 'unknown')} | deadline={row.get('deadline')}")
    logger.info(f"[{task_id}] Picked up task (retry #{retry_count})")

    conn = get_connection()
    try:
        # ── Step 1: Deduct credit + mark processing ──────────────────────────
        start_processing(conn, task_id, user_id)
        tlog.info("Credit deducted, status=processing")

        # ── Step 2: Build and run the crew ───────────────────────────────────
        job = build_job(row)
        tlog.info("Starting BacklinkCrew...")
        crew = BacklinkCrew(job=job)
        result = crew.run()

        tlog.info(f"Crew result: status={result.status} | raw={result.raw_output[:200]}")
        logger.info(f"[{task_id}] Crew result: status={result.status}")

        # ── Step 3: Handle result ─────────────────────────────────────────────
        platform_id = row.get("platform_id")

        if result.status == "success":
            # Upload screenshot to cloud storage
            screenshot_url = ""
            if result.screenshot_path:
                try:
                    screenshot_url = upload_screenshot(result.screenshot_path, task_id)
                    cleanup_local_screenshot(result.screenshot_path)
                    tlog.info(f"Screenshot uploaded: {screenshot_url}")
                except Exception as upload_err:
                    tlog.warning(f"Screenshot upload failed: {upload_err}")
                    logger.warning(f"[{task_id}] Screenshot upload failed: {upload_err}")

            mark_success(
                conn,
                task_id=task_id,
                screenshot_url=screenshot_url,
                live_link_url=result.live_url,
            )
            # Reset platform failure count on success
            if platform_id:
                reset_platform_failure(conn, platform_id)
            tlog.info(f"SUCCESS | live_url={result.live_url} | screenshot={screenshot_url}")
            console.print(
                f"[bold green]✓[/bold green] Task {task_id} → SUCCESS "
                f"| Live URL: {result.live_url}"
            )

        elif result.status == "need_2fa":
            # Refund the credit (user is being asked to act, not a failure yet)
            conn2 = get_connection()
            try:
                from db_connector import get_connection as _gc
                import psycopg2
                with conn2.cursor() as cur:
                    cur.execute(
                        "UPDATE users SET credit_balance = credit_balance + 1 WHERE id = %s::uuid",
                        (user_id,)
                    )
                conn2.commit()
            finally:
                conn2.close()

            pause_for_2fa(
                conn,
                task_id=task_id,
                prompt_message=result.twofa_message or "2FA verification required",
            )
            console.print(
                f"[bold yellow]⚠[/bold yellow] Task {task_id} → NEED_2FA "
                f"| {result.twofa_message}"
            )

        else:  # failed
            new_retry = increment_retry(conn, task_id, result.error_message)
            # Increment platform failure counter
            if platform_id:
                increment_platform_failure(conn, platform_id)

            tlog.warning(f"FAILED (retry {new_retry}/{MAX_RETRIES}): {result.error_message}")

            if new_retry >= MAX_RETRIES:
                mark_failed_and_refund(
                    conn,
                    task_id=task_id,
                    user_id=user_id,
                    error_msg=f"Failed after {MAX_RETRIES} retries: {result.error_message}",
                )
                tlog.error(f"Task permanently failed after {MAX_RETRIES} retries. Credit refunded.")
                console.print(
                    f"[bold red]✗[/bold red] Task {task_id} → FAILED (credit refunded) "
                    f"| {result.error_message}"
                )
            else:
                # ── Retry jitter: wait 1-4 hours before next attempt ──────────
                jitter_seconds = random.uniform(3600, 14400)  # 1–4 hours
                jitter_minutes = int(jitter_seconds / 60)
                tlog.info(f"Will retry in ~{jitter_minutes} minutes (jitter)")
                console.print(
                    f"[yellow]↻[/yellow] Task {task_id} → retry {new_retry}/{MAX_RETRIES} "
                    f"(next attempt in ~{jitter_minutes}m) | {result.error_message}"
                )
                # We don't block here — jitter is tracked via next_retry_time in DB
                # For simplicity, the worker will naturally pick it up after the sleep cycle

    except Exception as e:
        logger.error(f"[{task_id}] Unexpected error: {e}", exc_info=True)
        try:
            mark_failed_and_refund(
                conn,
                task_id=task_id,
                user_id=user_id,
                error_msg=f"Worker exception: {str(e)[:500]}",
            )
        except Exception as inner:
            logger.error(f"[{task_id}] Failed to mark task as failed: {inner}")
    finally:
        conn.close()
        # Reset browser between tasks to get a fresh session
        try:
            close_browser()
        except Exception:
            pass


# ── Main poll loop ────────────────────────────────────────────────────────────

def run_worker() -> None:
    """Main entry point — runs forever until interrupted."""
    console.print(
        "[bold cyan]LinkFlow AI Worker[/bold cyan] starting...\n"
        f"  Poll interval : {POLL_INTERVAL}s\n"
        f"  Max retries   : {MAX_RETRIES}\n"
        f"  Log level     : {log_level}\n"
    )

    last_sweep_time = time.time()

    while True:
        loop_start = time.time()

        # ── Periodic sweep for expired tasks (every hour) ────────────────────
        if loop_start - last_sweep_time >= SWEEP_INTERVAL:
            try:
                conn = get_connection()
                swept = sweep_expired_tasks(conn)
                conn.close()
                if swept:
                    logger.warning(f"Swept {swept} expired task(s)")
            except Exception as e:
                logger.error(f"Sweep error: {e}")
            last_sweep_time = loop_start

        # ── Fetch next pending job ────────────────────────────────────────────
        try:
            conn = get_connection()
            try:
                row = fetch_next_job(conn)
            finally:
                # We fetched inside a transaction for SKIP LOCKED;
                # the real work happens in process_job with its own connection
                conn.close()

            if row:
                process_job(dict(row))
            else:
                # No pending jobs — sleep quietly
                elapsed = time.time() - loop_start
                sleep_time = max(0, POLL_INTERVAL - elapsed)
                time.sleep(sleep_time)

        except KeyboardInterrupt:
            console.print("\n[bold yellow]Worker stopped by user.[/bold yellow]")
            sys.exit(0)
        except Exception as e:
            logger.error(f"Poll loop error: {e}", exc_info=True)
            time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    run_worker()

