"""
database.py — Zeabur Worker 数据库连接池 (改进版)

仅运行在 Zeabur (Docker 长连接进程)，不用于 Vercel。
使用 SQLAlchemy 连接池，pool_size=2 精确控制 Neon 连接数。

总连接公式: Worker数 x 2 + Vercel HTTP缓冲 < Neon免费层上限(10-20)

环境变量:
  DATABASE_URL — 建议使用 Neon Pooled URL (含 -pooler 后缀)
"""

import os
import logging
from contextlib import contextmanager

from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set")

# pool_size=2:      每 Worker 实例最多 2 个持久连接
# max_overflow=0:   绝不超限，宁可等待
# pool_recycle=300: 5 分钟自动重连，防止 Neon 断开空闲连接
# pool_pre_ping:    取连接前先 ping，确保连接可用
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=2,
    max_overflow=0,
    pool_recycle=300,
    pool_pre_ping=True,
    echo=False,
    connect_args={
        "connect_timeout": 10,
        "application_name": "linkflow_worker",
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@contextmanager
def get_db():
    """上下文管理器 — 自动归还连接到池"""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def check_connection() -> bool:
    """健康检查 — Worker 启动时调用"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("[DB] Connection pool healthy (pool_size=2, max_overflow=0)")
        return True
    except Exception as e:
        logger.error(f"[DB] Connection check failed: {e}")
        return False


def get_pool_status() -> dict:
    """获取连接池状态"""
    pool = engine.pool
    return {
        "size": pool.size(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
        "total": pool.size() + pool.overflow(),
    }









