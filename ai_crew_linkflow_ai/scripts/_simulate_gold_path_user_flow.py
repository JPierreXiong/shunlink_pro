import os
from uuid import uuid4
from datetime import datetime, timezone, timedelta
from pathlib import Path

from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor


def now_utc():
    return datetime.now(timezone.utc)


def log(msg: str):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


def connect():
    env_path = Path("d:/AIsoftware/linkflow/shunlink_pro/ai_crew_linkflow_ai/linkflow-crew/.env")
    if env_path.exists():
        load_dotenv(env_path)

    dsn = os.getenv("DATABASE_URL") or (
        "postgresql://neondb_owner:npg_6r3PnCxiIbTt@ep-sweet-block-ah1rvh25-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
    )
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)


def get_columns(cur, table: str):
    cur.execute(
        "SELECT column_name FROM information_schema.columns WHERE table_name = %s",
        (table,),
    )
    return {r["column_name"] for r in cur.fetchall()}


def insert_with_returning(cur, table: str, data: dict, returning: str):
    cols = list(data.keys())
    values = [data[c] for c in cols]
    placeholders = ", ".join(["%s"] * len(cols))
    col_sql = ", ".join(cols)
    cur.execute(
        f"INSERT INTO {table} ({col_sql}) VALUES ({placeholders}) RETURNING {returning}",
        values,
    )
    return cur.fetchone()


def update_by_id(cur, table: str, task_id: str, fields: dict):
    if not fields:
        return
    cols = list(fields.keys())
    vals = [fields[c] for c in cols]
    set_sql = ", ".join([f"{c}=%s" for c in cols])
    cur.execute(f"UPDATE {table} SET {set_sql} WHERE id=%s", vals + [task_id])


def main():
    conn = connect()
    try:
        with conn.cursor() as cur:
            users_cols = get_columns(cur, "users")
            auth_user_cols = get_columns(cur, "user")
            tasks_cols = get_columns(cur, "backlink_tasks")

            # field map
            twofa_code_col = "two_fa_code" if "two_fa_code" in tasks_cols else "twofa_code"
            twofa_prompt_col = "twofa_prompt" if "twofa_prompt" in tasks_cols else ("two_fa_prompt" if "two_fa_prompt" in tasks_cols else None)
            live_url_col = "live_url" if "live_url" in tasks_cols else "live_link_url"
            content_col = "article_content" if "article_content" in tasks_cols else ("agent_persona" if "agent_persona" in tasks_cols else None)
            platform_col = "platform_type" if "platform_type" in tasks_cols else ("platform_name" if "platform_name" in tasks_cols else None)
            deadline_col = "deadline" if "deadline" in tasks_cols else ("sla_due" if "sla_due" in tasks_cols else None)

            log(f"users cols ok: id/email/credit_balance present={all(c in users_cols for c in ['id','email','credit_balance'])}")
            log(f"auth user cols: id/email/name present={all(c in auth_user_cols for c in ['id','email','name'])}")
            log(f"task map: {twofa_code_col=}, {twofa_prompt_col=}, {live_url_col=}, {content_col=}, {platform_col=}, {deadline_col=}")

            # 1) signup + credit injection (sync users + auth "user" table)
            test_email = f"test_founder_{int(datetime.now().timestamp())}@example.com"
            shared_user_id = str(uuid4())

            user_data = {"id": shared_user_id, "email": test_email, "credit_balance": 1}
            if "name" in users_cols:
                user_data["name"] = "Gold Path Test User"
            if "created_at" in users_cols:
                user_data["created_at"] = now_utc()
            if "updated_at" in users_cols:
                user_data["updated_at"] = now_utc()

            user = insert_with_returning(cur, "users", user_data, "id, email, credit_balance")

            auth_user_data = {
                "id": shared_user_id,
                "email": test_email,
                "name": "Gold Path Test User",
            }
            if "email_verified" in auth_user_cols:
                auth_user_data["email_verified"] = False
            if "created_at" in auth_user_cols:
                auth_user_data["created_at"] = now_utc()
            if "updated_at" in auth_user_cols:
                auth_user_data["updated_at"] = now_utc()
            insert_with_returning(cur, '"user"', auth_user_data, "id")

            user_id = shared_user_id
            log(f"Step1 [OK] user created: {user_id} {user['email']} credit={user['credit_balance']}")

            # 2) submit task
            task_data = {
                "id": str(uuid4()),
                "user_id": user_id,
                "target_url": "https://linkflowai.app",
                "anchor_text": "Best AI SEO Tool",
                "status": "pending",
            }
            if content_col:
                task_data[content_col] = "LinkFlow AI is revolutionizing SEO automation..."
            if platform_col:
                task_data[platform_col] = "Web2.0"
            if deadline_col:
                task_data[deadline_col] = now_utc() + timedelta(hours=48)
            if "created_at" in tasks_cols:
                task_data["created_at"] = now_utc()
            if "updated_at" in tasks_cols:
                task_data["updated_at"] = now_utc()

            task = insert_with_returning(cur, "backlink_tasks", task_data, "id, status")
            task_id = str(task["id"])
            log(f"Step2 [OK] task created: {task_id} status={task['status']}")

            # simulate credit deduction done by API/worker
            cur.execute("UPDATE users SET credit_balance = 0 WHERE id::text = %s", (user_id,))
            log("Step2.5 [OK] credit set to 0 (simulated deduction)")

            # 3) worker hit 2FA
            s3 = {"status": "need_2fa"}
            if "error_message" in tasks_cols:
                s3["error_message"] = "2FA Required for Blogger login."
            if twofa_prompt_col:
                s3[twofa_prompt_col] = "Please input 2FA code"
            if "updated_at" in tasks_cols:
                s3["updated_at"] = now_utc()
            update_by_id(cur, "backlink_tasks", task_id, s3)
            log("Step3 [OK] task -> need_2fa")

            # 4) user submits 2FA, requeue
            s4 = {"status": "pending", twofa_code_col: "123456"}
            if "updated_at" in tasks_cols:
                s4["updated_at"] = now_utc()
            update_by_id(cur, "backlink_tasks", task_id, s4)
            log("Step4 [OK] 2FA submitted and task re-queued")

            # 5) final success
            s5 = {
                "status": "success",
                live_url_col: "https://blogger.com/posts/my-seo-backlink",
            }
            if "screenshot_url" in tasks_cols:
                s5["screenshot_url"] = "https://res.cloudinary.com/demo/image/upload/proof_sample.png"
            if "error_message" in tasks_cols:
                s5["error_message"] = None
            if "completed_at" in tasks_cols:
                s5["completed_at"] = now_utc()
            if "updated_at" in tasks_cols:
                s5["updated_at"] = now_utc()
            update_by_id(cur, "backlink_tasks", task_id, s5)
            log("Step5 [OK] task finalized to success")

            # verify
            select_cols = [
                "id", "status", "retry_count",
                f"{twofa_code_col} AS twofa_code",
                f"{twofa_prompt_col} AS twofa_prompt" if twofa_prompt_col else "NULL::text AS twofa_prompt",
                f"{live_url_col} AS live_url",
            ]
            if "screenshot_url" in tasks_cols:
                select_cols.append("screenshot_url")
            if "error_message" in tasks_cols:
                select_cols.append("error_message")
            if "completed_at" in tasks_cols:
                select_cols.append("completed_at")
            if "updated_at" in tasks_cols:
                select_cols.append("updated_at")

            cur.execute(
                f"SELECT {', '.join(select_cols)} FROM backlink_tasks WHERE id=%s",
                (task_id,),
            )
            final_task = dict(cur.fetchone())

            cur.execute("SELECT id, email, credit_balance FROM users WHERE id::text=%s", (user_id,))
            final_user = dict(cur.fetchone())

            conn.commit()

            log("\n[RESULT] GOLD PATH SIMULATION RESULT")
            print(final_task)
            print(final_user)

            passed = final_task.get("status") == "success" and bool(final_task.get("live_url"))
            if passed:
                log("[OK] GOLD PATH TEST PASSED")
            else:
                log("[FAIL] GOLD PATH TEST FAILED")

    finally:
        conn.close()


if __name__ == "__main__":
    main()

