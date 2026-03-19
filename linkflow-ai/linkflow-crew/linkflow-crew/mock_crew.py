"""
LinkFlow AI — Mock Crew for End-to-End Testing

Drops in as a replacement for BacklinkCrew during integration tests.
No real browser, no OpenAI tokens consumed.

Behaviour:
  - Sleeps 15-30s to simulate AI + browser work
  - 50% → success (with a placeholder screenshot)
  - 50% → need_2fa (tests the human-in-loop flow)

Usage:
    Set env var: USE_MOCK_CREW=true
    Then run:    python main.py
"""

import logging
import os
import random
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger("linkflow.mock")


@dataclass
class MockCrewResult:
    status: str          # 'success' | 'need_2fa' | 'failed'
    live_url: str = ""
    screenshot_path: str = ""
    twofa_message: str = ""
    error_message: str = ""
    raw_output: str = ""


def _make_placeholder_screenshot(task_id: str) -> str:
    """Write a minimal valid PNG so upload_screenshot doesn't fail."""
    png_bytes = bytes([
        0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,
        0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,
        0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,
        0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53,
        0xDE,0x00,0x00,0x00,0x0C,0x49,0x44,0x41,
        0x54,0x08,0xD7,0x63,0xF8,0xCF,0xC0,0x00,
        0x00,0x00,0x02,0x00,0x01,0xE2,0x21,0xBC,
        0x33,0x00,0x00,0x00,0x00,0x49,0x45,0x4E,
        0x44,0xAE,0x42,0x60,0x82,
    ])
    tmp = os.path.join(tempfile.gettempdir(), f"linkflow_mock_{task_id[:8]}.png")
    Path(tmp).write_bytes(png_bytes)
    return tmp


class MockBacklinkCrew:
    """
    Drop-in replacement for BacklinkCrew.
    Activated when USE_MOCK_CREW=true in environment.
    """

    def __init__(self, job):
        self.job = job
        logger.info(
            f"[MOCK] MockBacklinkCrew created for task {job.task_id} "
            f"| target={job.target_url} | platform={job.platform_name}"
        )

    def run(self) -> MockCrewResult:
        task_id = self.job.task_id

        # Simulate AI thinking + browser work
        delay = random.uniform(15, 30)
        logger.info(f"[MOCK] Simulating {delay:.0f}s of AI + browser work...")
        time.sleep(delay)

        # 50% success, 50% need_2fa
        outcome = random.choice(["success", "need_2fa"])
        logger.info(f"[MOCK] Outcome decided: {outcome}")

        if outcome == "success":
            screenshot_path = _make_placeholder_screenshot(task_id)
            result = MockCrewResult(
                status="success",
                live_url=f"https://mock-platform.example.com/post/{task_id[:8]}",
                screenshot_path=screenshot_path,
                raw_output=f"[MOCK] Successfully posted backlink for task {task_id}",
            )
            logger.info(f"[MOCK] SUCCESS → live_url={result.live_url}")
        else:
            result = MockCrewResult(
                status="need_2fa",
                twofa_message="[MOCK] Platform requires 2FA — please enter the code sent to your email.",
                raw_output=f"[MOCK] 2FA required for task {task_id}",
            )
            logger.info(f"[MOCK] NEED_2FA → {result.twofa_message}")

        return result

