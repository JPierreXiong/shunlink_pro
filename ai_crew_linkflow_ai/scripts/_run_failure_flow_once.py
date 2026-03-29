import os
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
        raise RuntimeError("DATABASE_URL not set")
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)


def resolve_task_cols(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='backlink_tasks'")
        cols = {r["column_name"] for r in cur.fetchall()}

    task_cols = {
        "id": "id",
        "user_id": "user_id",
        "status": "status",
        "retry_count": "retry_count",
        "error_message": "error_message" if "error_message" in cols else None,
        "updated_at": "updated_at" if "updated_at" in cols else None,
        "twofa_code": "two_fa_code" if "two_fa_code" in cols else ("twofa_code" if "twofa_code" in cols else None),
    }

    missing = [k for k in ["id", "user_id", "status", "retry_count"] if task_cols.get(k) not in cols]
    if missing:
        raise RuntimeError(f"Missing required task columns: {missing}")

    return task_cols


def pick_task(conn):
    forced = os.getenv("TEST_TASK_ID", "").strip()
    with conn.cursor() as cur:
        if forced:
            cur.execute("SELECT id FROM backlink_tasks WHERE id=%s", (forced,))
            row = cur.fetchone()
            if row:
                return str(row["id"])

        cur.execute("SELECT id FROM backlink_tasks ORDER BY created_at DESC LIMIT 1")
        row = cur.fetchone()
        if not row:
            raise RuntimeError("No task found in backlink_tasks")
        return str(row["id"])


def get_user_credit(conn, user_id: str):
    with conn.cursor() as cur:
        try:
            cur.execute("SELECT credit_balance FROM users WHERE id::text=%s", (user_id,))
            row = cur.fetchone()
            if row:
                return row["credit_balance"]
        except Exception:
            conn.rollback()

        try:
            cur.execute("SELECT credit_balance FROM users WHERE id=%s", (user_id,))
            row = cur.fetchone()
            if row:
                return row["credit_balance"]
        except Exception:
            conn.rollback()

    return None


def read_task(conn, task_id: str, cols: dict):
    with conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT id, user_id, status, retry_count,
                   {cols['error_message'] if cols.get('error_message') else 'NULL::text AS error_message'}
            FROM backlink_tasks
            WHERE id=%s
            """,
            (task_id,),
        )
        row = cur.fetchone()
    return dict(row)


def update_task(conn, task_id: str, fields: dict):
    if not fields:
        return
    set_clause = ", ".join([f"{k}=%s" for k in fields.keys()])
    values = list(fields.values()) + [task_id]
    with conn.cursor() as cur:
        cur.execute(f"UPDATE backlink_tasks SET {set_clause} WHERE id=%s", values)
    conn.commit()


def main():
    from retry_strategy import RetryStrategy

    conn = get_conn()
    try:
        cols = resolve_task_cols(conn)
        log(f"task column map: {cols}")

        task_id = pick_task(conn)
        t0 = read_task(conn, task_id, cols)
        user_id = str(t0["user_id"])
        credit_before = get_user_credit(conn, user_id)

        log(f"test task: {task_id}")
        log(f"initial: status={t0['status']}, retry_count={t0['retry_count']}, error={t0['error_message']}")
        log(f"user={user_id}, credit_before={credit_before}")

        # Step 0 reset baseline
        reset_fields = {
            "status": "pending",
            "retry_count": 0,
        }
        if cols.get("error_message"):
            reset_fields[cols["error_message"]] = None
        if cols.get("twofa_code"):
            reset_fields[cols["twofa_code"]] = None
        if cols.get("updated_at"):
            reset_fields[cols["updated_at"]] = datetime.now(timezone.utc)

        update_task(conn, task_id, reset_fields)
        log("Step 0: reset -> pending/retry_count=0")

        # Step 1 temporary failure => should retry
        temp_error = "timeout while publishing"
        should_retry_1 = RetryStrategy.should_retry(temp_error, 0)
        log(f"Step 1 check should_retry(temp,0) => {should_retry_1}")

        update_task(conn, task_id, {
            "status": "processing",
            **({cols['updated_at']: datetime.now(timezone.utc)} if cols.get("updated_at") else {}),
        })

        if should_retry_1:
            fields = {
                "status": "pending",
                "retry_count": 1,
            }
            if cols.get("error_message"):
                fields[cols["error_message"]] = temp_error
            if cols.get("updated_at"):
                fields[cols["updated_at"]] = datetime.now(timezone.utc)
            update_task(conn, task_id, fields)
            log("Step 1 result: processing -> pending (retry scheduled)")

        t1 = read_task(conn, task_id, cols)
        log(f"after retry step: status={t1['status']}, retry_count={t1['retry_count']}, error={t1['error_message']}")

        # Step 2 permanent failure => no retry => failed (refund trigger condition)
        perm_error = "invalid_credentials on platform"
        should_retry_2 = RetryStrategy.should_retry(perm_error, int(t1["retry_count"]))
        log(f"Step 2 check should_retry(permanent,{t1['retry_count']}) => {should_retry_2}")

        update_task(conn, task_id, {
            "status": "processing",
            **({cols['updated_at']: datetime.now(timezone.utc)} if cols.get("updated_at") else {}),
        })

        if not should_retry_2:
            fields = {
                "status": "failed",
                "retry_count": int(t1["retry_count"]) + 1,
            }
            if cols.get("error_message"):
                fields[cols["error_message"]] = perm_error
            if cols.get("updated_at"):
                fields[cols["updated_at"]] = datetime.now(timezone.utc)
            update_task(conn, task_id, fields)
            log("Step 2 result: processing -> failed (refund trigger condition met)")

        t2 = read_task(conn, task_id, cols)
        credit_after = get_user_credit(conn, user_id)

        log("Final snapshot:")
        log(f"  status={t2['status']}")
        log(f"  retry_count={t2['retry_count']}")
        log(f"  error_message={t2['error_message']}")
        log(f"  user_credit_before={credit_before}, user_credit_after={credit_after}")
        log("DONE: failure branch test completed")

    finally:
        conn.close()


if __name__ == "__main__":
    # ensure local module import works
    import sys
    crew_dir = "d:/AIsoftware/linkflow/shunlink_pro/ai_crew_linkflow_ai/linkflow-crew"
    sys.path.insert(0, crew_dir)
    # load .env BEFORE importing retry_strategy (which imports database.py at module level)
    from pathlib import Path as _Path
    from dotenv import load_dotenv as _load
    _load(_Path(crew_dir) / ".env")
    main()


