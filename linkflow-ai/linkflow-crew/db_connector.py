"""
LinkFlow AI — Neon PostgreSQL Connector (v2)

Aligned with the actual Drizzle schema in src/config/db/schema.ts.

Key changes from v1:
  - Column names match camelCase-to-snake_case Drizzle mappings:
      slaDue      → sla_due
      liveUrl     → live_url
      twoFaCode   → two_fa_code
      agentLog    → agent_log
      isRefunded  → is_refunded
      retryCount  → retry_count
      errorMessage→ error_message
      agentPersona→ agent_persona
      aiOptimize  → ai_optimize
  - Credits live in the 'credit' table — NOT users.credit_balance.
    The worker only READS tasks; all credit mutations go through
    the Vercel API endpoints (PATCH /api/backlink/tasks/[id] and
    POST /api/backlink/tasks/[id]/refund).
  - fetch_next_job only reads, so we can just fetch inside a plain
    connection (no transaction needed for the select itself).
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
# JOB FETCHING  (read-only, uses SKIP LOCKED for concurrency)
# ============================================================

def fetch_next_job(conn) -> Optional[dict]:
    """
    Fetch the oldest pending task whose SLA has not yet expired.
    Uses FOR UPDATE OF t SKIP LOCKED so multiple worker processes
    can run simultaneously without processing the same task twice.

    Returns a plain dict or None.
    """
    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                t.id,
                t.user_id,
                t.target_url,
                t.anchor_text,
                t.agent_persona,
                t.ai_optimize,
                t.platform_id,
                t.retry_count,
                t.two_fa_code,
                t.sla_due,
                p.name          AS platform_name,
                p.slug          AS platform_slug,
                p.home_url      AS platform_base_url,
                p.notes         AS platform_notes
            FROM backlink_tasks t
            LEFT JOIN backlink_platforms p ON t.platform_id = p.id
            WHERE t.status = 'pending'
              AND (t.sla_due IS NULL OR t.sla_due > NOW())
            ORDER BY t.created_at ASC
            FOR UPDATE OF t SKIP LOCKED
            LIMIT 1
        """)
        row = cur.fetchone()
        return dict(row) if row else None


# ============================================================
# EXPIRED TASK SWEEP
# ============================================================

def sweep_expired_tasks(conn) -> int:
    """
    Mark all tasks past their SLA deadline as failed.
    Credit refunds are handled by calling the Vercel refund API
    (POST /api/backlink/tasks/[id]/refund) — NOT done here.

    Returns the number of tasks swept.
    """
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE backlink_tasks
            SET status        = 'failed',
                error_message = 'Deadline exceeded (48h SLA)',
                updated_at    = NOW()
            WHERE status IN ('pending', 'processing', 'need_2fa')
              AND sla_due IS NOT NULL
              AND sla_due < NOW()
            RETURNING id
        """)
        rows = cur.fetchall()
    conn.commit()
    count = len(rows)
    if count:
        logger.warning(f"Swept {count} expired task(s)")
    return count


# ============================================================
# PLATFORM FAILURE TRACKING
# ============================================================

def increment_platform_failure(conn, platform_id: str) -> None:
    """
    Decrement the success_rate by 5 points when a platform fails.
    If success_rate drops below 20, mark platform inactive.
    """
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE backlink_platforms
            SET success_rate = GREATEST(0, success_rate - 5),
                is_active    = CASE
                                 WHEN success_rate - 5 < 20 THEN false
                                 ELSE is_active
                               END,
                updated_at   = NOW()
            WHERE id = %s
        """, (platform_id,))
    conn.commit()
    logger.debug(f"Platform {platform_id}: failure recorded, success_rate decremented")


def reset_platform_failure(conn, platform_id: str) -> None:
    """
    Bump success_rate by 2 points (capped at 100) on a successful submission.
    """
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE backlink_platforms
            SET success_rate  = LEAST(100, success_rate + 2),
                total_tasks   = total_tasks + 1,
                is_active     = true,
                updated_at    = NOW()
            WHERE id = %s
        """, (platform_id,))
    conn.commit()
    logger.debug(f"Platform {platform_id}: success recorded, success_rate incremented")
