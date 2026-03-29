"""
performance_monitor.py — 性能监控和统计

记录任务执行时间、成功率、错误率等关键指标
定期输出统计信息
"""

import logging
import time
from datetime import datetime, timezone
from collections import defaultdict

logger = logging.getLogger(__name__)


class PerformanceMonitor:
    """性能监控"""
    
    def __init__(self):
        self.task_count = 0
        self.success_count = 0
        self.failure_count = 0
        self.need_2fa_count = 0
        self.total_time = 0
        self.min_time = float('inf')
        self.max_time = 0
        
        # 错误统计
        self.error_counts = defaultdict(int)
        
        # 平台统计
        self.platform_stats = defaultdict(lambda: {
            'count': 0,
            'success': 0,
            'failure': 0,
            'total_time': 0,
        })
        
        # 启动时间
        self.start_time = datetime.now(timezone.utc)
    
    def record_task(self, task_id: str, status: str, duration: float, 
                   platform: str = None, error: str = None):
        """记录任务执行"""
        self.task_count += 1
        self.total_time += duration
        self.min_time = min(self.min_time, duration)
        self.max_time = max(self.max_time, duration)
        
        # 状态统计
        if status == "success":
            self.success_count += 1
        elif status == "need_2fa":
            self.need_2fa_count += 1
        else:
            self.failure_count += 1
            if error:
                self.error_counts[error[:50]] += 1
        
        # 平台统计
        if platform:
            self.platform_stats[platform]['count'] += 1
            self.platform_stats[platform]['total_time'] += duration
            if status == "success":
                self.platform_stats[platform]['success'] += 1
            else:
                self.platform_stats[platform]['failure'] += 1
        
        logger.debug(
            f"[Monitor] Task {task_id} completed in {duration:.1f}s "
            f"(status: {status})"
        )
    
    def get_stats(self) -> dict:
        """获取统计信息"""
        if self.task_count == 0:
            return {
                'task_count': 0,
                'uptime': 0,
            }
        
        avg_time = self.total_time / self.task_count
        success_rate = (self.success_count / self.task_count) * 100
        uptime = (datetime.now(timezone.utc) - self.start_time).total_seconds()
        
        return {
            'task_count': self.task_count,
            'success_count': self.success_count,
            'failure_count': self.failure_count,
            'need_2fa_count': self.need_2fa_count,
            'success_rate': f"{success_rate:.1f}%",
            'avg_time': f"{avg_time:.1f}s",
            'min_time': f"{self.min_time:.1f}s" if self.min_time != float('inf') else "N/A",
            'max_time': f"{self.max_time:.1f}s",
            'total_time': f"{self.total_time:.1f}s",
            'uptime': f"{int(uptime)}s",
            'tasks_per_hour': f"{(self.task_count / (uptime / 3600)):.1f}" if uptime > 0 else "N/A",
        }
    
    def get_platform_stats(self) -> dict:
        """获取平台统计"""
        stats = {}
        for platform, data in self.platform_stats.items():
            if data['count'] > 0:
                success_rate = (data['success'] / data['count']) * 100
                avg_time = data['total_time'] / data['count']
                stats[platform] = {
                    'count': data['count'],
                    'success': data['success'],
                    'failure': data['failure'],
                    'success_rate': f"{success_rate:.1f}%",
                    'avg_time': f"{avg_time:.1f}s",
                }
        return stats
    
    def get_error_stats(self) -> dict:
        """获取错误统计"""
        return dict(sorted(
            self.error_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10])  # 返回前 10 个错误
    
    def print_stats(self):
        """打印统计信息"""
        stats = self.get_stats()
        
        logger.info("=" * 70)
        logger.info("📊 Performance Statistics")
        logger.info("=" * 70)
        logger.info(f"  Tasks Processed    : {stats['task_count']}")
        logger.info(f"  Success            : {stats['success_count']}")
        logger.info(f"  Failure            : {stats['failure_count']}")
        logger.info(f"  Need 2FA           : {stats['need_2fa_count']}")
        logger.info(f"  Success Rate       : {stats['success_rate']}")
        logger.info(f"  Avg Time           : {stats['avg_time']}")
        logger.info(f"  Min Time           : {stats['min_time']}")
        logger.info(f"  Max Time           : {stats['max_time']}")
        logger.info(f"  Total Time         : {stats['total_time']}")
        logger.info(f"  Uptime             : {stats['uptime']}")
        logger.info(f"  Tasks/Hour         : {stats['tasks_per_hour']}")
        
        # 平台统计
        platform_stats = self.get_platform_stats()
        if platform_stats:
            logger.info("-" * 70)
            logger.info("📍 Platform Statistics")
            for platform, data in platform_stats.items():
                logger.info(
                    f"  {platform:20} | "
                    f"Count: {data['count']:3} | "
                    f"Success: {data['success_rate']:6} | "
                    f"Avg: {data['avg_time']:8}"
                )
        
        # 错误统计
        error_stats = self.get_error_stats()
        if error_stats:
            logger.info("-" * 70)
            logger.info("❌ Top Errors")
            for error, count in error_stats.items():
                logger.info(f"  {count:3}x {error}")
        
        logger.info("=" * 70)
    
    def should_print_stats(self) -> bool:
        """判断是否应该打印统计信息"""
        # 每 10 个任务打印一次
        return self.task_count > 0 and self.task_count % 10 == 0


# 全局监控实例
_monitor = None


def get_monitor() -> PerformanceMonitor:
    """获取全局监控实例"""
    global _monitor
    if _monitor is None:
        _monitor = PerformanceMonitor()
    return _monitor


def record_task(task_id: str, status: str, duration: float, 
               platform: str = None, error: str = None):
    """记录任务执行"""
    monitor = get_monitor()
    monitor.record_task(task_id, status, duration, platform, error)
    
    if monitor.should_print_stats():
        monitor.print_stats()


