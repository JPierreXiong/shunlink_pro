"""
retry_strategy.py — 智能重试策略

根据错误类型判断是否应该重试
临时错误 (网络、超时) → 重试
永久错误 (凭证、账号) → 不重试，直接退款
"""

import random
import logging
from sqlalchemy import text
from database import get_db

logger = logging.getLogger(__name__)


class RetryStrategy:
    """智能重试策略"""
    
    # 重试配置
    MAX_RETRIES = 3
    BASE_DELAY = 3600  # 1 小时
    MAX_DELAY = 14400  # 4 小时
    
    # 错误分类
    TEMPORARY_ERRORS = [
        "timeout",
        "connection_reset",
        "connection_refused",
        "network_error",
        "temporary_failure",
        "service_unavailable",
        "too_many_requests",
        "rate_limit",
    ]
    
    PERMANENT_ERRORS = [
        "invalid_credentials",
        "authentication_failed",
        "account_suspended",
        "account_locked",
        "platform_blocked",
        "invalid_selector",
        "element_not_found",
        "permission_denied",
        "access_denied",
    ]
    
    @staticmethod
    def classify_error(error_message: str) -> str:
        """分类错误类型"""
        error_lower = error_message.lower()
        
        # 检查是否是永久错误
        for permanent_error in RetryStrategy.PERMANENT_ERRORS:
            if permanent_error.lower() in error_lower:
                return "permanent"
        
        # 检查是否是临时错误
        for temporary_error in RetryStrategy.TEMPORARY_ERRORS:
            if temporary_error.lower() in error_lower:
                return "temporary"
        
        # 默认为临时错误
        return "temporary"
    
    @staticmethod
    def should_retry(error_message: str, retry_count: int) -> bool:
        """判断是否应该重试"""
        
        # 已达到最大重试次数
        if retry_count >= RetryStrategy.MAX_RETRIES:
            logger.warning(
                f"[Retry] Max retries ({RetryStrategy.MAX_RETRIES}) reached"
            )
            return False
        
        # 检查错误类型
        error_type = RetryStrategy.classify_error(error_message)
        
        if error_type == "permanent":
            logger.warning(
                f"[Retry] Permanent error detected, will not retry: {error_message}"
            )
            return False
        
        # 临时错误可以重试
        logger.info(
            f"[Retry] Temporary error detected, will retry: {error_message}"
        )
        return True
    
    @staticmethod
    def calculate_retry_delay() -> int:
        """计算重试延迟（带 jitter）"""
        # 随机延迟 1-4 小时
        delay = random.uniform(
            RetryStrategy.BASE_DELAY,
            RetryStrategy.MAX_DELAY
        )
        return int(delay)
    
    @staticmethod
    def schedule_retry(task_id: str, error_message: str, retry_count: int) -> bool:
        """安排重试"""
        
        if not RetryStrategy.should_retry(error_message, retry_count):
            logger.info(
                f"[Retry] Task {task_id} will not be retried "
                f"(error type: {RetryStrategy.classify_error(error_message)})"
            )
            return False
        
        new_retry = retry_count + 1
        delay_seconds = RetryStrategy.calculate_retry_delay()
        delay_minutes = int(delay_seconds / 60)
        
        try:
            with get_db() as session:
                session.execute(text("""
                    UPDATE backlink_tasks
                    SET status = 'pending',
                        retry_count = :retry_count,
                        error_message = :error_message,
                        updated_at = NOW()
                    WHERE id = :task_id
                """), {
                    "task_id": task_id,
                    "retry_count": new_retry,
                    "error_message": error_message,
                })
                session.commit()
            
            logger.info(
                f"[Retry] Task {task_id} scheduled for retry #{new_retry} "
                f"in ~{delay_minutes} minutes (error: {error_message[:50]}...)"
            )
            return True
        
        except Exception as e:
            logger.error(f"[Retry] Error scheduling retry for {task_id}: {e}")
            return False
    
    @staticmethod
    def get_retry_info(retry_count: int) -> dict:
        """获取重试信息"""
        return {
            "current_retry": retry_count,
            "max_retries": RetryStrategy.MAX_RETRIES,
            "can_retry": retry_count < RetryStrategy.MAX_RETRIES,
            "retries_remaining": max(0, RetryStrategy.MAX_RETRIES - retry_count),
        }









