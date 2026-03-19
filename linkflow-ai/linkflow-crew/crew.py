"""
LinkFlow AI — CrewAI Crew Definition (v2)

Changes from v1:
  - BacklinkJob no longer has platform_credentials field.
    Platform accounts are stored as env vars:
      PLATFORM_CREDS_{SLUG}_USERNAME / PLATFORM_CREDS_{SLUG}_PASSWORD
  - selector_config is resolved from platform_configs.json inside the crew.
  - article_content defaults to empty; ContentAgent generates from anchor_text.
"""

import json
import logging
import os
from dataclasses import dataclass
from pathlib import Path
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

_CONFIGS_PATH = Path(__file__).parent / "src" / "platforms" / "platform_configs.json"


def _load_platform_configs() -> list:
    try:
        return json.loads(_CONFIGS_PATH.read_text(encoding="utf-8"))
    except Exception as e:
        logger.warning(f"Could not load platform_configs.json: {e}")
        return []


_PLATFORM_CONFIGS: list = _load_platform_configs()


def _find_platform_config(platform_name: str) -> dict:
    """Return matching platform config, or first available as fallback."""
    name_lower = (platform_name or "").lower()
    for p in _PLATFORM_CONFIGS:
        if name_lower and name_lower in p.get("site_name", "").lower():
            return p
    return _PLATFORM_CONFIGS[0] if _PLATFORM_CONFIGS else {}


def _get_platform_credentials(platform_name: str) -> Optional[dict]:
    """
    Read platform login credentials from environment variables.

    Lookup order:
      1. PLATFORM_CREDS_{NAME_UPPER}_USERNAME / PASSWORD
      2. PLATFORM_USERNAME / PLATFORM_PASSWORD  (generic fallback)
    """
    slug = (platform_name or "generic").upper().replace(" ", "_").replace("-", "_")
    username = os.getenv(f"PLATFORM_CREDS_{slug}_USERNAME") or os.getenv("PLATFORM_USERNAME")
    password = os.getenv(f"PLATFORM_CREDS_{slug}_PASSWORD") or os.getenv("PLATFORM_PASSWORD")
    if username and password:
        return {"username": username, "password": password}
    return None


# ---------------------------------------------------------------------------
# Data transfer objects
# ---------------------------------------------------------------------------

@dataclass
class BacklinkJob:
    """Represents a single backlink task fetched from the DB."""
    task_id: str
    user_id: str
    target_url: str
    anchor_text: str
    article_content: str          # empty = ContentAgent writes it
    platform_name: str            # e.g. "Blogger" or "Auto"
    platform_base_url: str        # populated from DB join; crew may override
    selector_config: dict         # populated by crew from platform_configs.json
    twofa_code: Optional[str] = None


@dataclass
class CrewResult:
    """Result returned after crew execution."""
    status: str                   # success | need_2fa | failed
    screenshot_path: str = ""
    live_url: str = ""
    twofa_message: str = ""
    error_message: str = ""
    raw_output: str = ""


# ---------------------------------------------------------------------------
# Crew
# ---------------------------------------------------------------------------

class BacklinkCrew:
    """
    Orchestrates ContentAgent + NavigatorAgent in sequential process.

    Step 1: ContentAgent prepares the article.
    Step 2: NavigatorAgent submits it (receives Step 1 output as context).
    """

    def __init__(self, job: BacklinkJob):
        self.job = job

    def run(self) -> CrewResult:
        """Execute the crew and return a CrewResult."""
        # Resolve platform config from JSON file
        platform_cfg = _find_platform_config(self.job.platform_name)
        selector_config = platform_cfg.get("selector_config", {})
        platform_base_url = (
            self.job.platform_base_url
            or platform_cfg.get("base_url", "")
        )
        platform_name = (
            platform_cfg.get("site_name") or self.job.platform_name or "Auto"
        )

        # Resolve credentials from env vars
        creds = _get_platform_credentials(platform_name)

        logger.info(
            f"BacklinkCrew start | task={self.job.task_id} "
            f"platform={platform_name} url={self.job.target_url}"
        )

        # Build agents
        content_agent   = create_content_agent()
        navigator_agent = create_navigator_agent()

        # Build tasks
        content_task = create_content_preparation_task(
            content_agent=content_agent,
            target_url=self.job.target_url,
            anchor_text=self.job.anchor_text,
            article_content=self.job.article_content,
            platform_name=platform_name,
        )

        submission_task = create_backlink_submission_task(
            navigator_agent=navigator_agent,
            platform_name=platform_name,
            platform_base_url=platform_base_url,
            selector_config=selector_config,
            task_id=self.job.task_id,
            platform_credentials=creds,
        )
        submission_task.context = [content_task]

        # Assemble crew
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
            logger.info(f"Crew output [{self.job.task_id}]: {raw[:300]}")
            return self._parse_output(raw)
        except Exception as e:
            logger.error(f"Crew error [{self.job.task_id}]: {e}")
            return CrewResult(status="failed", error_message=str(e)[:500])

    def _parse_output(self, raw: str) -> CrewResult:
        """
        Parse the Navigator agent's final output.

        Expected formats:
          STATUS:SUCCESS|SCREENSHOT:/tmp/linkflow_xxx.png|LIVE_URL:https://...
          STATUS:NEED_2FA:<description>
          STATUS:FAILED:<error message>
        """
        result = CrewResult(status="failed", raw_output=raw)

        if "STATUS:SUCCESS" in raw:
            result.status = "success"
            if "SCREENSHOT:" in raw:
                after = raw.split("SCREENSHOT:", 1)[1]
                result.screenshot_path = after.split("|")[0].strip()
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
            result.status = "failed"
            result.error_message = f"Unexpected output format: {raw[:200]}"

        return result
