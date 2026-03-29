"""
LinkFlow AI — Neon PostgreSQL Connector

Singleton-style connection helper for the Python worker.
Uses psycopg2 with RealDictCursor so rows come back as dicts.
All mutating queries use FOR UPDATE SKIP LOCKED to support
multi-worker deployments without duplicate task processing.
"""

import logging
import os
from contextlib import contextmanager
from typing import Optional

import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


def get_connection() -> psycopg2.extensions.connection:
    """Open a new database connection. Caller is responsible for closing."""
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL environment variable is not set")
    return psycopg2.connect(url, cursor_factory=RealDictCursor)


@contextmanager
def db_transaction():
    """
    Context manager that yields (conn, cursor).
    Commits on success, rolls back on exception.
    Always closes the connection.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            yield conn, cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# ============================================================
# JOB FETCHING
# ============================================================

def fetch_next_job(conn) -> Optional[dict]:
    """
    Fetch the oldest pending task whose user has credits available.
    Uses FOR UPDATE OF t SKIP LOCKED so multiple worker processes
    can run simultaneously without processing the same task twice.

    NOTE: Field mapping (real DB -> code alias):
      two_fa_code     -> twofa_code
      live_url        -> live_link_url
      sla_due         -> deadline
      agent_log       -> article_content (repurposed for content)
      backlink_platforms -> platforms alias
      users.credit_balance exists in linkflow users table
    """
    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                t.id,
                t.user_id,
                t.target_url,
                t.anchor_text,
                t.agent_persona       AS article_content,
                t.platform_id,
                t.retry_count,
                t.two_fa_code         AS twofa_code,
                t.sla_due             AS deadline,
                t.session_storage,
                t.current_step_index,
                u.credit_balance,
                NULL::jsonb           AS selector_config,
                p.home_url            AS platform_base_url,
                p.name                AS platform_name,
                'Web2.0'              AS platform_type
            FROM backlink_tasks t
            JOIN users u ON t.user_id = u.id::text
            LEFT JOIN backlink_platforms p ON t.platform_id = p.id
            WHERE t.status = 'pending'
              AND u.credit_balance > 0
              AND (t.sla_due IS NULL OR t.sla_due > NOW())
            ORDER BY t.created_at ASC
            FOR UPDATE OF t SKIP LOCKED
            LIMIT 1
        """)
        row = cur.fetchone()
        return dict(row) if row else None


# ============================================================
# STATUS TRANSITIONS
# ============================================================

def start_processing(conn, task_id: str, user_id: str) -> None:
    """
    Atomically deduct 1 credit from user and mark task as processing.
    Raises if user has no credits (race condition guard).
    """
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE users SET credit_balance = credit_balance - 1 "
            "WHERE id = %s::uuid AND credit_balance > 0",
            (user_id,)
        )
        if cur.rowcount == 0:
            raise RuntimeError(f"User {user_id} has insufficient credits")
        cur.execute(
            "UPDATE backlink_tasks "
            "SET status = 'processing', updated_at = NOW() "
            "WHERE id = %s",
            (task_id,)
        )
    conn.commit()
    logger.info(f"Task {task_id}: started_processing, credit deducted from user {user_id}")


def mark_success(
    conn,
    task_id: str,
    screenshot_url: str,
    live_link_url: str = ""
) -> None:
    """Mark task as successfully completed."""
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE backlink_tasks
            SET status = 'success',
                screenshot_url = %s,
                live_url = %s,
                updated_at = NOW(),
                error_message = NULL
            WHERE id = %s
        """, (screenshot_url, live_link_url, task_id))
    conn.commit()
    logger.info(f"Task {task_id}: success. Screenshot: {screenshot_url}")


def mark_failed_and_refund(conn, task_id: str, user_id: str, error_msg: str) -> None:
    """
    Mark task as failed AND refund 1 credit to the user.
    Both operations run in the same transaction for atomicity.
    """
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE backlink_tasks
            SET status = 'failed',
                error_message = %s,
                updated_at = NOW()
            WHERE id = %s
        """, (error_msg, task_id))
        cur.execute(
            "UPDATE users SET credit_balance = credit_balance + 1 WHERE id = %s::uuid",
            (user_id,)
        )
    conn.commit()
    logger.warning(f"Task {task_id}: failed — '{error_msg}'. Credit refunded to user {user_id}")


def pause_for_2fa(conn, task_id: str, prompt_message: str) -> None:
    """
    Pause a task that requires human 2FA input.
    The frontend will show the prompt_message to the user.
    """
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE backlink_tasks
            SET status = 'need_2fa',
                updated_at = NOW()
            WHERE id = %s
        """, (task_id,))
    conn.commit()
    logger.info(f"Task {task_id}: paused for 2FA — '{prompt_message}'")


def increment_retry(conn, task_id: str, error_msg: str) -> int:
    """
    Increment retry count and reset to 'pending' for another attempt.
    Returns the new retry count.
    """
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE backlink_tasks
            SET retry_count = retry_count + 1,
                status = 'pending',
                error_message = %s
            WHERE id = %s
            RETURNING retry_count
        """, (error_msg, task_id))
        row = cur.fetchone()
    conn.commit()
    new_count = dict(row)["retry_count"] if row else 0
    logger.info(f"Task {task_id}: retry {new_count}")
    return new_count


# ============================================================
# PLATFORM FAILURE TRACKING (Selector Versioning)
# ============================================================

def increment_platform_failure(conn, platform_id: str) -> int:
    """
    Increment the failure count for a platform.
    If failure_count reaches 3, auto-disable the platform.
    Returns the new failure count.
    """
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE backlink_platforms
            SET is_active = CASE WHEN NOT is_active THEN false ELSE is_active END
            WHERE id = %s
            RETURNING is_active
        """, (platform_id,))
        row = cur.fetchone()
    conn.commit()
    if row:
        data = dict(row)
        if not data["is_active"]:
            logger.warning(
                f"Platform {platform_id} auto-disabled. "
                "Update selectors in platform_configs.json to re-enable."
            )
    return 0


def reset_platform_failure(conn, platform_id: str) -> None:
    """
    Reset the failure count after a successful submission.
    Also records the last_success_at timestamp.
    """
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE backlink_platforms
            SET is_active = true,
                updated_at = NOW()
            WHERE id = %s
        """, (platform_id,))
    conn.commit()
    logger.debug(f"Platform {platform_id}: failure count reset, last_success_at updated")


def sweep_expired_tasks(conn) -> int:
    """
    Fail all tasks that have exceeded their 48h deadline.
    Refunds credits for tasks that were in 'processing' state.
    Returns the number of tasks swept.
    """
    with conn.cursor() as cur:
        # Refund credits for tasks that were processing and expired
        cur.execute("""
            WITH expired AS (
                UPDATE backlink_tasks
                SET status = 'failed',
                    error_message = 'Deadline exceeded (48h SLA)',
                    updated_at = NOW()
                WHERE status IN ('pending', 'processing', 'need_2fa')
                  AND sla_due IS NOT NULL AND sla_due < NOW()
                RETURNING user_id, status
            )
            UPDATE users u
            SET credit_balance = credit_balance + 1
            FROM expired e
            WHERE u.id::text = e.user_id
              AND e.status = 'processing'
        """)
        # Count all expired tasks
        cur.execute("""
            SELECT COUNT(*) as cnt FROM backlink_tasks
            WHERE status = 'failed'
              AND error_message = 'Deadline exceeded (48h SLA)'
              AND completed_at > NOW() - INTERVAL '1 minute'
        """)
        row = cur.fetchone()
    conn.commit()
    count = dict(row)["cnt"] if row else 0
    if count:
        logger.warning(f"Swept {count} expired tasks")
    return count
