"""
LinkFlow AI — CrewAI Crew Definition

Defines the BacklinkCrew that orchestrates the two agents:
  1. ContentAgent  — prepares and optimizes the article
  2. NavigatorAgent — submits it to the target platform

Usage:
    result = BacklinkCrew(job=task_data).run()
"""

import json
import logging
import os
from dataclasses import dataclass
from typing import Optional

from crewai import Crew, Process
from dotenv import load_dotenv

from src.agents.content_agent import create_content_agent
from src.agents.navigator_agent import create_navigator_agent
from src.tasks.backlink_task import (
    create_content_preparation_task,
    create_backlink_submission_task,
)

load_dotenv()
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


@dataclass
class CrewResult:
    """Result returned after Crew execution."""
    status: str          # 'success' | 'need_2fa' | 'failed'
    screenshot_path: str = ""
    live_url: str = ""
    twofa_message: str = ""
    error_message: str = ""
    raw_output: str = ""


class BacklinkCrew:
    """
    Orchestrates the content + navigator agents to submit one backlink.

    The crew runs in sequential process:
      Step 1: ContentAgent prepares the article
      Step 2: NavigatorAgent submits it (with Step 1 output as context)
    """

    def __init__(self, job: BacklinkJob):
        self.job = job

    def run(self) -> CrewResult:
        """Execute the crew and parse the result."""
        logger.info(
            f"Starting BacklinkCrew for task {self.job.task_id} "
            f"→ {self.job.platform_name} | URL: {self.job.target_url}"
        )

        # Build agents
        content_agent = create_content_agent()
        navigator_agent = create_navigator_agent()

        # Build tasks
        content_task = create_content_preparation_task(
            content_agent=content_agent,
            target_url=self.job.target_url,
            anchor_text=self.job.anchor_text,
            article_content=self.job.article_content,
            platform_name=self.job.platform_name,
        )

        submission_task = create_backlink_submission_task(
            navigator_agent=navigator_agent,
            platform_name=self.job.platform_name,
            platform_base_url=self.job.platform_base_url,
            selector_config=self.job.selector_config,
            task_id=self.job.task_id,
            platform_credentials=self.job.platform_credentials,
        )
        # Navigator gets the content task output as context
        submission_task.context = [content_task]

        # Assemble and run the crew
        crew = Crew(
            agents=[content_agent, navigator_agent],
            tasks=[content_task, submission_task],
            process=Process.sequential,
            verbose=True,
            output_log_file=f"logs/crew_{self.job.task_id}.txt",
        )

        try:
            crew_output = crew.kickoff()
            raw = str(crew_output).strip()
            logger.info(f"Crew output for task {self.job.task_id}: {raw[:300]}")
            return self._parse_output(raw)
        except Exception as e:
            logger.error(f"Crew execution error for task {self.job.task_id}: {e}")
            return CrewResult(status="failed", error_message=str(e))

    def _parse_output(self, raw: str) -> CrewResult:
        """
        Parse the Navigator agent's final output string.

        Expected formats:
          STATUS:SUCCESS|SCREENSHOT:/tmp/linkflow_xxx.png|LIVE_URL:https://...
          STATUS:NEED_2FA:<description>
          STATUS:FAILED:<error message>
        """
        result = CrewResult(status="failed", raw_output=raw)

        if "STATUS:SUCCESS" in raw:
            result.status = "success"
            # Extract screenshot path
            if "SCREENSHOT:" in raw:
                after = raw.split("SCREENSHOT:", 1)[1]
                result.screenshot_path = after.split("|")[0].strip()
            # Extract live URL
            if "LIVE_URL:" in raw:
                after = raw.split("LIVE_URL:", 1)[1]
                result.live_url = after.split("|")[0].strip()

        elif "STATUS:NEED_2FA:" in raw:
            result.status = "need_2fa"
            result.twofa_message = raw.split("STATUS:NEED_2FA:", 1)[1].strip()

        elif "STATUS:FAILED:" in raw:
            result.status = "failed"
            result.error_message = raw.split("STATUS:FAILED:", 1)[1].strip()

        else:
            # Unexpected output format — treat as failure
            result.status = "failed"
            result.error_message = f"Unexpected crew output format: {raw[:200]}"

        return result


