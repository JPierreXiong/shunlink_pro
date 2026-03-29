"""
task_consumer.py — LinkFlow AI 任务消费心脏

部署位置: Zeabur (Docker 长连接进程)
职责:
  1. 每 5 秒扫描 Neon 数据库中 status='pending' 的 backlink_tasks
  2. 将任务状态原子锁定为 'processing'，防止多 Worker 重复领取
  3. 调用 CrewAI 智能体执行外链发布
  4. 执行完毕后将结果 (live_url, screenshot_url) 或错误写回数据库
  5. 需要 2FA 时将状态置为 'need_2fa' 挂起，等待用户通过 Vercel API 提交
  6. 失败超过最大重试次数后标记 'failed'，并调用 Vercel 退款 API

流量对接 (Vercel <-> Neon <-> Zeabur):
  Vercel API  ->  写入 pending  ->  Neon DB
  Neon DB     ->  Worker 轮询   ->  Zeabur
  Zeabur      ->  写回结果      ->  Neon DB
  Neon DB     ->  Vercel UI 轮询展示给用户
"""

import os
import time
import logging
import signal
import sys
import requests
from datetime import datetime, timezone

from database import get_db, check_connection

# ---------------------------------------------------------------------------
# 日志配置
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
    stream=sys.stdout,  # 打到 stdout，Zeabur 控制台直接可见，不落库
)
logger = logging.getLogger("task_consumer")

# ---------------------------------------------------------------------------
# 环境变量
# ---------------------------------------------------------------------------
VERCEL_APP_URL = os.getenv("VERCEL_APP_URL", "").rstrip("/")
WORKER_SECRET = os.getenv("WORKER_SECRET", "")
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL_SECONDS", "5"))
MAX_RETRIES = int(os.getenv("MAX_TASK_RETRIES", "3"))

# ---------------------------------------------------------------------------
# 优雅退出
# ---------------------------------------------------------------------------
_shutdown = False


def _handle_signal(signum, frame):
    global _shutdown
    logger.info(f"Received signal {signum}, shutting down gracefully...")
    _shutdown = True


signal.signal(signal.SIGTERM, _handle_signal)
signal.signal(signal.SIGINT, _handle_signal)


# ---------------------------------------------------------------------------
# 数据库操作
# ---------------------------------------------------------------------------

def fetch_one_pending_task(session):
    """
    原子操作: 取 1 条 pending 任务并立即锁定为 processing。
    FOR UPDATE SKIP LOCKED 防止多 Worker 实例抢同一条任务。
    返回 dict 或 None。
    """
    from sqlalchemy import text
    row = session.execute(text(
        """
        UPDATE backlink_tasks
        SET    status = 'processing',
               updated_at = NOW()
        WHERE  id = (
            SELECT id FROM backlink_tasks
            WHERE  status = 'pending'
            ORDER  BY created_at ASC
            LIMIT  1
            FOR UPDATE SKIP LOCKED
        )
        RETURNING
            id, user_id, platform_id, target_url, anchor_text,
            agent_persona, ai_optimize, two_fa_code, retry_count, sla_due
        """
    )).fetchone()
    session.commit()
    if row is None:
        return None
    return dict(row._mapping)


def update_task(session, task_id: str, **fields):
    """通用字段更新 + 自动刷新 updated_at。"""
    from sqlalchemy import text
    fields["updated_at"] = datetime.now(timezone.utc)
    set_clause = ", ".join(f"{k} = :{k}" for k in fields)
    session.execute(
        text(f"UPDATE backlink_tasks SET {set_clause} WHERE id = :task_id"),
        {"task_id": task_id, **fields},
    )
    session.commit()


# ---------------------------------------------------------------------------
# Vercel API 调用
# ---------------------------------------------------------------------------

def _worker_headers() -> dict:
    return {
        "Content-Type": "application/json",
        "x-worker-secret": WORKER_SECRET,
    }


def call_vercel_refund(task_id: str):
    """任务彻底失败后，调用 Vercel 退款接口还 1 积分给用户。"""
    if not VERCEL_APP_URL:
        logger.warning("[refund] VERCEL_APP_URL not set, skipping refund call")
        return
    url = f"{VERCEL_APP_URL}/api/backlink/tasks/{task_id}/refund"
    try:
        resp = requests.post(url, headers=_worker_headers(), timeout=15)
        if resp.status_code == 200:
            logger.info(f"[refund] Task {task_id} credit refunded successfully")
        else:
            logger.error(f"[refund] Failed: {resp.status_code} {resp.text[:200]}")
    except Exception as e:
        logger.error(f"[refund] Request error: {e}")


# ---------------------------------------------------------------------------
# AI Agent 执行层
# ---------------------------------------------------------------------------

def run_agent(task: dict) -> dict:
    """
    调用 CrewAI 多智能体执行外链发布。

    返回值结构:
      成功:   {"status": "success",  "live_url": "...", "screenshot_url": "...", "agent_log": "..."}
      需验证: {"status": "need_2fa", "agent_log": "..."}
      失败:   {"status": "failed",   "error_message": "...", "agent_log": "..."}

    TODO: 将下方 stub 替换为真实 CrewAI / Playwright 调用。
    参考: linkflow-crew/src/agents/  linkflow-crew/src/tasks/
    """
    logger.info(
        f"[agent] Running task {task['id']} | "
        f"url={task['target_url']} | persona={task['agent_persona']}"
    )

    # -- STUB: replace with real CrewAI call ---------------------------
    # from src.crew import LinkFlowCrew
    # return LinkFlowCrew().kickoff(inputs={
    #     "target_url":   task["target_url"],
    #     "anchor_text":  task["anchor_text"],
    #     "platform_id":  task["platform_id"],
    #     "agent_persona":task["agent_persona"],
    #     "two_fa_code":  task.get("two_fa_code"),
    # })
    # ------------------------------------------------------------------

    # Dev stub: returns success so end-to-end flow can be verified
    return {
        "status": "success",
        "live_url": f"https://example.com/post/{task['id'][:8]}",
        "screenshot_url": "",
        "agent_log": "[stub] Agent execution placeholder — replace with CrewAI",
    }


# ---------------------------------------------------------------------------
# 单任务生命周期
# ---------------------------------------------------------------------------

def process_task(task: dict):
    task_id = task["id"]
    retry_count = task.get("retry_count") or 0
    logger.info(f"[task] Processing {task_id} (retry={retry_count})")

    try:
        result = run_agent(task)
    except Exception as e:
        logger.exception(f"[task] Agent raised unexpected exception for {task_id}")
        result = {"status": "failed", "error_message": str(e), "agent_log": ""}

    status = result.get("status", "failed")

    with get_db() as session:
        if status == "success":
            update_task(
                session,
                task_id,
                status="success",
                live_url=result.get("live_url", ""),
                screenshot_url=result.get("screenshot_url", ""),
                agent_log=result.get("agent_log", ""),
                error_message=None,
            )
            logger.info(
                f"[task] {task_id} -> success | live_url={result.get('live_url')}"
            )

        elif status == "need_2fa":
            update_task(
                session,
                task_id,
                status="need_2fa",
                agent_log=result.get("agent_log", ""),
            )
            logger.info(f"[task] {task_id} -> need_2fa, waiting for user input")

        else:  # failed
            new_retry = retry_count + 1
            if new_retry < MAX_RETRIES:
                update_task(
                    session,
                    task_id,
                    status="pending",
                    retry_count=new_retry,
                    error_message=result.get("error_message", ""),
                    agent_log=result.get("agent_log", ""),
                )
                logger.warning(
                    f"[task] {task_id} failed, retry {new_retry}/{MAX_RETRIES} queued"
                )
            else:
                update_task(
                    session,
                    task_id,
                    status="failed",
                    retry_count=new_retry,
                    error_message=result.get(
                        "error_message", "Max retries exceeded"
                    ),
                    agent_log=result.get("agent_log", ""),
                )
                logger.error(
                    f"[task] {task_id} -> failed (max retries exceeded)"
                )
                call_vercel_refund(task_id)


# ---------------------------------------------------------------------------
# 主轮询循环
# ---------------------------------------------------------------------------

def main():
    logger.info("LinkFlow AI Task Consumer starting...")
    logger.info(f"  POLL_INTERVAL={POLL_INTERVAL}s  MAX_RETRIES={MAX_RETRIES}")
    logger.info(f"  VERCEL_APP_URL={VERCEL_APP_URL or '(not set)'}")

    if not check_connection():
        logger.critical("Database connection failed at startup. Exiting.")
        sys.exit(1)

    logger.info("Task Consumer running. Polling for pending tasks...")

    while not _shutdown:
        try:
            with get_db() as session:
                task = fetch_one_pending_task(session)

            if task:
                # 立即处理，不等待下次间隔（保证吞吐）
                process_task(task)
            else:
                # 没有任务，等待轮询间隔
                time.sleep(POLL_INTERVAL)

        except Exception as e:
            # 主循环任何异常都记录后继续，保证 Worker 不崩溃
            logger.exception(f"[loop] Unexpected error: {e}")
            time.sleep(POLL_INTERVAL)

    logger.info("Task Consumer shut down cleanly.")


if __name__ == "__main__":
    main()
