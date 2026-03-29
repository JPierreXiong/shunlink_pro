"""
cleanup_cron.py — 定时清理超期任务

每小时运行一次，检查是否有任务超过 48h SLA
如果超期，自动标记为失败并退款
"""

import logging
import os
from datetime import datetime, timezone
from sqlalchemy import text
from database import get_db

logger = logging.getLogger(__name__)


def cleanup_expired_tasks():
    """清理超过 48h 的未完成任务"""
    try:
        with get_db() as session:
            # 查找超期任务
            expired_tasks = session.execute(text("""
                SELECT id, user_id, status, created_at
                FROM backlink_tasks
                WHERE status NOT IN ('success', 'failed')
                AND created_at < NOW() - INTERVAL '48 hours'
                ORDER BY created_at ASC
            """)).fetchall()
            
            if not expired_tasks:
                logger.info("[Cleanup] No expired tasks found")
                return 0
            
            logger.warning(f"[Cleanup] Found {len(expired_tasks)} expired tasks")
            
            processed = 0
            for task in expired_tasks:
                task_id, user_id, status, created_at = task
                
                try:
                    # 标记为失败
                    session.execute(text("""
                        UPDATE backlink_tasks
                        SET status = 'failed',
                            error_message = 'SLA violation: Task exceeded 48h deadline',
                            completed_at = NOW()
                        WHERE id = :task_id
                    """), {"task_id": task_id})
                    
                    # 退款
                    session.execute(text("""
                        UPDATE users
                        SET credit_balance = credit_balance + 1
                        WHERE id = :user_id
                    """), {"user_id": user_id})
                    
                    session.commit()
                    
                    logger.info(
                        f"[Cleanup] Task {task_id} marked as failed, "
                        f"credit refunded to {user_id}"
                    )
                    processed += 1
                
                except Exception as e:
                    logger.error(f"[Cleanup] Error processing task {task_id}: {e}")
                    session.rollback()
            
            logger.info(f"[Cleanup] Processed {processed}/{len(expired_tasks)} expired tasks")
            return processed
    
    except Exception as e:
        logger.error(f"[Cleanup] Fatal error: {e}")
        return 0


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    cleanup_expired_tasks()









