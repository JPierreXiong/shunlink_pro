"""
Audit Agent — 质检员

职责:
  1. 停留 5 秒观察页面
  2. 检查是否出现 "Success" / "Published" 字样
  3. 调用 ScreenshotTool 截图
  4. 调用 CloudinaryUploadTool 上传
  5. 返回 proof_url
"""

import logging
from crewai import Agent
from langchain_openai import ChatOpenAI

logger = logging.getLogger(__name__)


def create_audit_agent() -> Agent:
    """创建 Audit Agent"""
    return Agent(
        role="Quality Assurance Specialist",
        goal=(
            "Verify that the backlink was successfully submitted. "
            "Take screenshots as proof and upload them to cloud storage."
        ),
        backstory=(
            "You are a meticulous QA specialist. "
            "You verify every submission by checking for success indicators on the page. "
            "You take high-quality screenshots and ensure they are properly uploaded to the cloud. "
            "You understand the importance of proof for the customer."
        ),
        verbose=True,
        allow_delegation=False,
        llm=ChatOpenAI(model="gpt-4-turbo", temperature=0.2),
    )









