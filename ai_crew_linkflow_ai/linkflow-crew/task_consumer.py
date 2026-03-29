"""
task_consumer.py — LinkFlow AI 任务消费心脏 (生产级版本)

部署位置: Zeabur (Docker 长连接进程)
职责:
  1. 每 5 秒扫描 Neon 数据库中 status='pending' 的 backlink_tasks
  2. 将任务状态原子锁定为 'processing'，防止多 Worker 重复领取
  3. 调用 CrewAI 智能体执行外链发布
  4. 执行完毕后将结果 (live_url, screenshot_url) 或错误写回数据库
  5. 需要 2FA 时将状态置为 'need_2fa' 挂起，等待用户通过 Vercel API 提交
  6. 失败超过最大重试次数后标记 'failed'，并调用 Vercel 退款 API
  7. 每小时运行一次清理任务，处理超期任务
"""

import os
import time
import logging
import signal
import sys
import requests
import threading
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional, Dict, Any


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

from sqlalchemy import text
from database import get_db, check_connection
from retry_strategy import RetryStrategy
from cleanup_cron import cleanup_expired_tasks
from performance_monitor import record_task, get_monitor
from storage import upload_screenshot, cleanup_local_screenshot

# ---------------------------------------------------------------------------
# 日志配置
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
    stream=sys.stdout,
)
logger = logging.getLogger("task_consumer")

# ---------------------------------------------------------------------------
# 环境变量
# ---------------------------------------------------------------------------
VERCEL_APP_URL = os.getenv("VERCEL_APP_URL", "").rstrip("/")
WORKER_SECRET = os.getenv("WORKER_SECRET", "")
WORKER_ID = os.getenv("ZEABUR_CONTAINER_ID", f"worker-{int(time.time())}")
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL_SECONDS", "5"))
MAX_RETRIES = int(os.getenv("MAX_TASK_RETRIES", "3"))
CLEANUP_INTERVAL = 3600  # 1 小时

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

# backlink_tasks 字段兼容映射（不同版本 schema 字段名可能不同）
_TASK_FIELDS: Optional[Dict[str, str]] = None


def _resolve_task_fields(session) -> Dict[str, str]:
    global _TASK_FIELDS
    if _TASK_FIELDS is not None:
        return _TASK_FIELDS

    rows = session.execute(text(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'backlink_tasks'"
    )).fetchall()
    cols = {r[0] for r in rows}

    twofa_code_col = "two_fa_code" if "two_fa_code" in cols else "twofa_code"
    twofa_prompt_col = "two_fa_prompt" if "two_fa_prompt" in cols else ("twofa_prompt" if "twofa_prompt" in cols else None)
    live_url_col = "live_url" if "live_url" in cols else "live_link_url"
    article_content_col = "article_content" if "article_content" in cols else "agent_persona"
    platform_type_col = "platform_type" if "platform_type" in cols else "platform_name"
    ai_thought_col = "ai_thought" if "ai_thought" in cols else "agent_log"

    required = [twofa_code_col, live_url_col, article_content_col]
    missing = [c for c in required if c not in cols]
    if missing:
        raise RuntimeError(f"Missing required backlink_tasks columns: {missing}")

    _TASK_FIELDS = {
        "twofa_code": twofa_code_col,
        "twofa_prompt": twofa_prompt_col,
        "live_url": live_url_col,
        "article_content": article_content_col,
        "platform_type": platform_type_col,
        "ai_thought": ai_thought_col,
    }
    logger.info(f"[schema] backlink_tasks field map: {_TASK_FIELDS}")
    return _TASK_FIELDS


# ---------------------------------------------------------------------------
# 数据库操作
# ---------------------------------------------------------------------------

def fetch_one_pending_task(session) -> Optional[Dict[str, Any]]:
    """
    原子操作: 取 1 条 pending 或 need_2fa (已有验证码) 任务并立即锁定为 processing。
    FOR UPDATE SKIP LOCKED 防止多 Worker 实例抢同一条任务。
    返回 dict 或 None。
    """
    fields = _resolve_task_fields(session)

    rows = session.execute(text(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'backlink_tasks'"
    )).fetchall()
    cols = {r[0] for r in rows}
    has_worker_id = "worker_id" in cols

    lock_set = "worker_id = :worker_id," if has_worker_id else ""
    params = {"worker_id": WORKER_ID} if has_worker_id else {}

    row = session.execute(text(f"""
        UPDATE backlink_tasks
        SET    status = 'processing',
               {lock_set}
               updated_at = NOW()
        WHERE  id = (
            SELECT id FROM backlink_tasks
            WHERE  (status = 'pending')
               OR (status = 'need_2fa' AND {fields['twofa_code']} IS NOT NULL)
            ORDER  BY created_at ASC
            LIMIT  1
            FOR UPDATE SKIP LOCKED
        )
        RETURNING
            id, user_id, platform_id, target_url, anchor_text,
            {fields['article_content']} AS article_content,
            {fields['platform_type']} AS platform_type,
            {fields['twofa_code']} AS twofa_code,
            retry_count, session_storage, current_step_index
    """), params).fetchone()
    session.commit()
    if row is None:
        return None
    return dict(row._mapping)


def update_task(session, task_id: str, **fields):
    """通用字段更新 + 自动刷新 updated_at。"""
    fields["updated_at"] = datetime.now(timezone.utc)
    set_clause = ", ".join(f"{k} = :{k}" for k in fields)
    session.execute(
        text(f"UPDATE backlink_tasks SET {set_clause} WHERE id = :task_id"),
        {"task_id": task_id, **fields},
    )
    session.commit()


def update_ai_thought(session, task_id: str, thought: str):
    """实时更新 AI 思考过程，前端可轮询显示"""
    fields = _resolve_task_fields(session)
    session.execute(
        text(f"UPDATE backlink_tasks SET {fields['ai_thought']} = :thought WHERE id = :task_id"),
        {"task_id": task_id, "thought": thought},
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

def run_agent(task: Dict[str, Any], session) -> Dict[str, Any]:
    """
    调用 CrewAI 多智能体执行外链发布。

    返回值结构:
      成功:   {"status": "success",  "live_url": "...", "screenshot_url": "...", "agent_log": "..."}
      需验证: {"status": "need_2fa", "agent_log": "..."}
      失败:   {"status": "failed",   "error_message": "...", "agent_log": "..."}
    """
    task_id = task["id"]
    logger.info(
        f"[agent] Running task {task_id} | "
        f"url={task['target_url']} | platform={task['platform_type']}"
    )

    try:
        update_ai_thought(session, task_id, "Initializing CrewAI agents...")

        from crew import BacklinkCrew

        job = BacklinkJob(
            task_id=task_id,
            user_id=task["user_id"],
            target_url=task["target_url"],
            anchor_text=task["anchor_text"],
            article_content=task.get("article_content") or "",
            platform_name=task.get("platform_type") or "Unknown Platform",
            platform_base_url="",
            selector_config={},
            twofa_code=task.get("twofa_code"),
            session_storage=task.get("session_storage"),
        )

        update_ai_thought(session, task_id, "Running crew workflow...")
        crew = BacklinkCrew(job=job)
        result = crew.run()

        if result.status == "success":
            screenshot_url = ""
            if result.screenshot_path:
                screenshot_url = upload_screenshot(result.screenshot_path, task_id)
                cleanup_local_screenshot(result.screenshot_path)

            return {
                "status": "success",
                "live_url": result.live_url,
                "screenshot_url": screenshot_url,
                "agent_log": result.raw_output,
            }

        if result.status == "need_2fa":
            return {
                "status": "need_2fa",
                "agent_log": result.twofa_message or result.raw_output,
            }

        return {
            "status": "failed",
            "error_message": result.error_message or "Crew execution failed",
            "agent_log": result.raw_output,
        }

    except Exception as e:
        logger.exception(f"[agent] Exception for {task_id}")
        return {
            "status": "failed",
            "error_message": str(e),
            "agent_log": f"Exception: {str(e)}",
        }


# ---------------------------------------------------------------------------
# 单任务生命周期
# ---------------------------------------------------------------------------

def process_task(task: Dict[str, Any]):
    """处理单个任务的完整生命周期"""
    task_id = task["id"]
    retry_count = task.get("retry_count") or 0
    platform_type = task.get("platform_type", "Unknown")

    start_time = time.time()
    logger.info(f"[task] Processing {task_id} (retry={retry_count})")

    with get_db() as session:
        fields = _resolve_task_fields(session)
        cols = {
            r[0]
            for r in session.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'backlink_tasks'"
            )).fetchall()
        }
        has_worker_id = "worker_id" in cols

        try:
            # 执行 Agent
            result = run_agent(task, session)

        except Exception as e:
            logger.exception(f"[task] Agent raised unexpected exception for {task_id}")
            result = {
                "status": "failed",
                "error_message": str(e),
                "agent_log": "",
            }

        status = result.get("status", "failed")
        duration = time.time() - start_time

        # 根据结果分类处理
        if status == "success":
            payload = {
                "status": "success",
                fields["live_url"]: result.get("live_url", ""),
                "screenshot_url": result.get("screenshot_url", ""),
                fields["ai_thought"]: result.get("agent_log", ""),
                "error_message": None,
                "completed_at": datetime.now(timezone.utc),
                "execution_time_ms": int(duration * 1000),
            }
            update_task(session, task_id, **payload)
            logger.info(
                f"[task] {task_id} -> success | live_url={result.get('live_url')} | time={duration:.1f}s"
            )
            record_task(task_id, "success", duration, platform_type)

        elif status == "need_2fa":
            # 任务标记为需要 2FA，清空 worker_id 释放锁
            payload = {
                "status": "need_2fa",
                fields["ai_thought"]: result.get("agent_log", ""),
                "error_message": "Awaiting 2FA code from user",
            }
            if has_worker_id:
                payload["worker_id"] = None
            if fields["twofa_prompt"] in cols:
                payload[fields["twofa_prompt"]] = result.get("agent_log", "")

            update_task(session, task_id, **payload)
            logger.info(f"[task] {task_id} -> need_2fa, waiting for user input")
            record_task(task_id, "need_2fa", duration, platform_type)

        else:  # failed
            error_msg = result.get("error_message", "Unknown error")

            # 使用智能重试策略
            if RetryStrategy.should_retry(error_msg, retry_count):
                # 安排重试
                if RetryStrategy.schedule_retry(task_id, error_msg, retry_count):
                    logger.warning(
                        f"[task] {task_id} failed, retry scheduled | error={error_msg[:50]}"
                    )
                    record_task(task_id, "retry", duration, platform_type, error_msg)
                else:
                    # 重试安排失败，标记为失败
                    payload = {
                        "status": "failed",
                        "retry_count": retry_count + 1,
                        "error_message": error_msg,
                        fields["ai_thought"]: result.get("agent_log", ""),
                    }
                    if has_worker_id:
                        payload["worker_id"] = None
                    update_task(session, task_id, **payload)
                    call_vercel_refund(task_id)
                    logger.error(f"[task] {task_id} -> failed (credit refunded)")
                    record_task(task_id, "failed", duration, platform_type, error_msg)
            else:
                # 彻底失败 - 退款
                payload = {
                    "status": "failed",
                    "retry_count": retry_count + 1,
                    "error_message": error_msg,
                    fields["ai_thought"]: result.get("agent_log", ""),
                }
                if has_worker_id:
                    payload["worker_id"] = None
                update_task(session, task_id, **payload)
                call_vercel_refund(task_id)
                logger.error(
                    f"[task] {task_id} -> failed (permanent error, credit refunded) | {error_msg[:50]}"
                )
                record_task(task_id, "failed", duration, platform_type, error_msg)


# ---------------------------------------------------------------------------
# 后台清理线程
# ---------------------------------------------------------------------------

def run_cleanup_thread():
    """后台线程：每小时运行一次清理"""
    logger.info("[Cleanup] Background cleanup thread started")
    
    while not _shutdown:
        try:
            cleanup_expired_tasks()
        except Exception as e:
            logger.error(f"[Cleanup] Error: {e}")
        
        # 等待 1 小时
        time.sleep(CLEANUP_INTERVAL)
    
    logger.info("[Cleanup] Background cleanup thread stopped")


# ---------------------------------------------------------------------------
# 主轮询循环
# ---------------------------------------------------------------------------

def main():
    logger.info("=" * 70)
    logger.info("LinkFlow AI Task Consumer starting...")
    logger.info(f"  Worker ID           : {WORKER_ID}")
    logger.info(f"  POLL_INTERVAL       : {POLL_INTERVAL}s")
    logger.info(f"  MAX_RETRIES         : {MAX_RETRIES}")
    logger.info(f"  CLEANUP_INTERVAL    : {CLEANUP_INTERVAL}s")
    logger.info(f"  VERCEL_APP_URL      : {VERCEL_APP_URL or '(not set)'}")
    logger.info("=" * 70)

    if not check_connection():
        logger.critical("Database connection failed at startup. Exiting.")
        sys.exit(1)

    # 启动清理线程
    cleanup_thread = threading.Thread(target=run_cleanup_thread, daemon=True)
    cleanup_thread.start()

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

    # 打印最终统计
    monitor = get_monitor()
    monitor.print_stats()
    
    logger.info("Task Consumer shut down cleanly.")


if __name__ == "__main__":
    main()
