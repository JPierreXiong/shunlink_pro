"""
LinkFlow AI — CrewAI Crew Definition (完整实现)

Defines the BacklinkCrew that orchestrates the three agents:
  1. ManagerAgent  — 解析任务、判断平台类型、分配执行路径
  2. BrowserAgent  — 使用 Playwright 执行登录、填表、提交
  3. AuditAgent    — 验证成功、截图、上传

Usage:
    result = BacklinkCrew(job=task_data).run()
"""

import json
import logging
import os
import time
from dataclasses import dataclass
from typing import Optional

from crewai import Crew, Process, Task, Agent
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

from src.agents.manager_agent import create_manager_agent
from src.agents.browser_agent import create_browser_agent
from src.agents.audit_agent import create_audit_agent
from src.tools.browser_tools import get_browser_tools, close_browser
from src.tools.visual_tools import process_and_upload_proof

logger = logging.getLogger(__name__)


@dataclass
class BacklinkJob:
    """Data transfer object representing a single backlink task from the DB."""
    task_id: str
    user_id: str
    target_url: str
    anchor_text: str
    article_content: str
    platform_name: str
    platform_base_url: str
    selector_config: dict
    platform_credentials: Optional[dict] = None  # {username, password}
    twofa_code: Optional[str] = None
    session_storage: Optional[dict] = None  # Cookies/Session for 2FA recovery


@dataclass
class CrewResult:
    """Result returned after Crew execution."""
    status: str          # 'success' | 'need_2fa' | 'failed'
    screenshot_path: str = ""
    live_url: str = ""
    twofa_message: str = ""
    error_message: str = ""
    raw_output: str = ""


class TwoFARequired(Exception):
    """Custom exception for 2FA detection"""
    pass


class BacklinkCrew:
    """
    Orchestrates the manager + browser + audit agents to submit one backlink.

    The crew runs in sequential process:
      Step 1: ManagerAgent analyzes the platform and creates execution plan
      Step 2: BrowserAgent executes login, form filling, and submission
      Step 3: AuditAgent verifies success and uploads screenshot
    """

    def __init__(self, job: BacklinkJob):
        self.job = job
        self.browser_tools = get_browser_tools()
        logger.info(f"[Crew] Initialized for task {job.task_id}")

    def run(self) -> CrewResult:
        """Execute the crew and parse the result."""
        logger.info(
            f"[Crew] Starting BacklinkCrew for task {self.job.task_id} "
            f"→ {self.job.platform_name} | URL: {self.job.target_url}"
        )

        try:
        # Build agents
            manager_agent = create_manager_agent()
            browser_agent = create_browser_agent()
            audit_agent = create_audit_agent()

        # Build tasks
            manager_task = self._create_manager_task(manager_agent)
            browser_task = self._create_browser_task(browser_agent, manager_task)
            audit_task = self._create_audit_task(audit_agent, browser_task)

            # Create crew
        crew = Crew(
                agents=[manager_agent, browser_agent, audit_agent],
                tasks=[manager_task, browser_task, audit_task],
            process=Process.sequential,
            verbose=True,
            )

            # Execute crew
            result = crew.kickoff()
            logger.info(f"[Crew] Execution completed: {result}")

            # Parse result
            return self._parse_crew_result(result)

        except TwoFARequired as e:
            logger.warning(f"[Crew] 2FA required: {str(e)}")
            return CrewResult(
                status="need_2fa",
                twofa_message=str(e),
                raw_output=str(e),
            )

        except Exception as e:
            logger.exception(f"[Crew] Execution failed: {e}")
            return CrewResult(
                status="failed",
                error_message=str(e),
                raw_output=str(e),
            )

        finally:
            # Clean up browser
            try:
                close_browser()
        except Exception as e:
                logger.warning(f"[Crew] Error closing browser: {e}")

    def _create_manager_task(self, agent: Agent) -> Task:
        """Create the manager task"""
        return Task(
            description=f"""
            Analyze the target platform and create an execution plan.
            
            Platform: {self.job.platform_name}
            Target URL: {self.job.target_url}
            Anchor Text: {self.job.anchor_text}
            
            Your task:
            1. Determine if login is required
            2. Identify the login URL and form selectors
            3. Identify the new post/article URL
            4. Identify the form fields for title, content, and publish button
            5. Check if 2FA is likely required
            6. Create a step-by-step execution plan
            
            Return a detailed JSON plan with all selectors and steps.
            """,
            agent=agent,
            expected_output="A detailed JSON execution plan with all selectors and steps",
        )

    def _create_browser_task(self, agent: Agent, manager_task: Task) -> Task:
        """Create the browser automation task"""
        return Task(
            description=f"""
            Execute the backlink submission on the target platform.
            
            Use the execution plan from the previous step to:
            1. Navigate to the platform
            2. Login if required (use credentials: {json.dumps(self.job.platform_credentials or {})})
            3. Fill in the article form with:
               - Title/Anchor: {self.job.anchor_text}
               - Content: {self.job.article_content[:200]}...
            4. Submit the article
            5. Wait 5 seconds for confirmation
            6. Take a screenshot
            
            IMPORTANT: If you detect a 2FA prompt, STOP immediately and report it.
            Common 2FA indicators:
            - "Enter code" input field
            - "Verification code" prompt
            - "OTP" field
            - "Google Authenticator" request
            
            If 2FA is detected, raise TwoFARequired exception.
            """,
            agent=agent,
            context=[manager_task],
            expected_output="Confirmation of successful submission or 2FA detection",
        )

    def _create_audit_task(self, agent: Agent, browser_task: Task) -> Task:
        """Create the audit/verification task"""
        return Task(
            description=f"""
            Verify that the backlink was successfully submitted.
            
            Your task:
            1. Wait 5 seconds for the page to fully load
            2. Check for success indicators:
               - "Success" message
               - "Published" confirmation
               - URL change to the published article
               - Green checkmark or similar
            3. Take a full-page screenshot
            4. Upload the screenshot to cloud storage
            5. Return the proof URL
            
            If verification fails, report the error.
            """,
            agent=agent,
            context=[browser_task],
            expected_output="Proof URL of the successfully submitted backlink",
        )

    def _parse_crew_result(self, result: str) -> CrewResult:
        """Parse the crew execution result"""
        try:
            # Try to parse as JSON
            data = json.loads(result)
            
            if data.get("status") == "success":
                return CrewResult(
                    status="success",
                    live_url=data.get("live_url", ""),
                    screenshot_path=data.get("screenshot_path", ""),
                    raw_output=result,
                )
            elif data.get("status") == "need_2fa":
                raise TwoFARequired(data.get("message", "2FA required"))
            else:
                return CrewResult(
                    status="failed",
                    error_message=data.get("error", "Unknown error"),
                    raw_output=result,
                )
        except json.JSONDecodeError:
            # If not JSON, treat as success if it contains positive keywords
            if any(keyword in result.lower() for keyword in ["success", "published", "submitted"]):
                return CrewResult(
                    status="success",
                    live_url="",
                    screenshot_path="",
                    raw_output=result,
                )
            else:
                return CrewResult(
                    status="failed",
                    error_message="Could not parse crew result",
                    raw_output=result,
                )
