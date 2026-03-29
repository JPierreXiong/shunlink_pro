"""
Manager Agent — 决策大脑

职责:
  1. 解析任务内容 (target_url, anchor_text, platform_type)
  2. 从数据库查询平台配置 (selector_config)
  3. 判断是否需要登录、是否需要 2FA 恢复
  4. 分配执行计划给 BrowserAgent
  5. 监听 2FA 异常，发出中断指令
"""

import logging
from crewai import Agent
from langchain_openai import ChatOpenAI

logger = logging.getLogger(__name__)


def create_manager_agent() -> Agent:
    """创建 Manager Agent"""
    return Agent(
        role="Platform Manager",
        goal=(
            "Analyze the target platform and create an execution plan. "
            "Determine login requirements, detect 2FA prompts, and coordinate with BrowserAgent."
        ),
        backstory=(
            "You are an expert in web platform automation. "
            "You understand different platform architectures (WordPress, Blogger, Medium, etc.) "
            "and can quickly identify the best approach to submit a backlink. "
            "You are cautious about 2FA requirements and always prepare for them."
        ),
        verbose=True,
        allow_delegation=False,
        llm=ChatOpenAI(model="gpt-4-turbo", temperature=0.3),
    )









