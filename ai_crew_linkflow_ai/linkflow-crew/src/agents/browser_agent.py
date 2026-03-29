"""
Browser Agent — 执行手

职责:
  1. 使用 Playwright 打开浏览器
  2. 注入 Cookies (如果有 session_storage)
  3. 执行登录 (如果需要)
  4. 检测 2FA 提示 (5 秒超时)
  5. 填写表单 (anchor_text, article_content)
  6. 提交发布
  7. 等待 5 秒确认成功
"""

import logging
from crewai import Agent
from langchain_openai import ChatOpenAI

logger = logging.getLogger(__name__)


def create_browser_agent() -> Agent:
    """创建 Browser Agent"""
    return Agent(
        role="Browser Automation Specialist",
        goal=(
            "Execute the backlink submission on the target platform using browser automation. "
            "Handle login, form filling, and submission. Detect and report 2FA requirements."
        ),
        backstory=(
            "You are an expert in Playwright browser automation. "
            "You can navigate complex web interfaces, fill forms like a human, and handle edge cases. "
            "You are trained to detect 2FA prompts and report them immediately. "
            "You always take screenshots to verify successful submission."
        ),
        verbose=True,
        allow_delegation=False,
        llm=ChatOpenAI(model="gpt-4-turbo", temperature=0.2),
    )









