"""
LinkFlow AI — Playwright Browser Tools for CrewAI

Wraps all Playwright browser automation as CrewAI BaseTool subclasses
so that the Navigator agent can invoke them like any other tool.

Tools provided:
  - NavigateTool       : Go to a URL
  - FillFormTool       : Fill an input/textarea with human-like typing
  - ClickTool          : Click a CSS selector
  - ScreenshotTool     : Take a full-page screenshot
  - DetectTwoFATool    : Check if current page requires 2FA
  - GetPageContentTool : Return page HTML snippet for AI analysis
  - WaitForTool        : Wait for a selector to appear
"""

import asyncio
import logging
import os
import random
import tempfile
import time
from typing import Optional, Type

from crewai.tools import BaseTool
from pydantic import BaseModel, Field
from playwright.sync_api import sync_playwright, Page, Browser, BrowserContext

logger = logging.getLogger(__name__)

# Module-level browser state (one browser per worker process)
_playwright = None
_browser: Optional[Browser] = None
_context: Optional[BrowserContext] = None
_page: Optional[Page] = None


def get_page() -> Page:
    """Return the current page, launching browser if needed."""
    global _playwright, _browser, _context, _page

    if _page is None or _page.is_closed():
        if _playwright is None:
            _playwright = sync_playwright().start()

        proxy_server = os.getenv("PROXY_SERVER")
        proxy_config = None
        if proxy_server:
            proxy_config = {
                "server": proxy_server,
                "username": os.getenv("PROXY_USERNAME", ""),
                "password": os.getenv("PROXY_PASSWORD", ""),
            }

        _browser = _playwright.chromium.launch(
            headless=os.getenv("HEADLESS", "true").lower() == "true",
            proxy=proxy_config,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
            ],
        )
        _context = _browser.new_context(
            viewport={"width": 1366, "height": 768},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            locale="en-US",
            timezone_id="America/New_York",
        )
        _page = _context.new_page()
        # Remove webdriver property to avoid detection
        _page.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        )
        logger.info("[Browser] Launched new browser context")

    return _page


def close_browser():
    """Close the browser and reset state."""
    global _playwright, _browser, _context, _page
    try:
        if _page:
            _page.close()
        if _context:
            _context.close()
        if _browser:
            _browser.close()
        if _playwright:
            _playwright.stop()
    except Exception as e:
        logger.warning(f"Error closing browser: {e}")
    finally:
        _playwright = None
        _browser = None
        _context = None
        _page = None
        logger.info("[Browser] Browser closed and state reset")


# ============================================================================
# Tool Input Models
# ============================================================================

class NavigateInput(BaseModel):
    url: str = Field(..., description="The URL to navigate to")


class ClickInput(BaseModel):
    selector: str = Field(..., description="CSS selector of the element to click")
    timeout_ms: int = Field(default=5000, description="Timeout in milliseconds")


class FillInput(BaseModel):
    selector: str = Field(..., description="CSS selector of the input field")
    text: str = Field(..., description="Text to fill in")
    delay_ms: int = Field(default=50, description="Delay between keystrokes (ms)")


class ScreenshotInput(BaseModel):
    path: str = Field(default="", description="Optional path to save screenshot")


class DetectTwoFAInput(BaseModel):
    timeout_ms: int = Field(default=5000, description="Timeout in milliseconds")


class WaitForInput(BaseModel):
    selector: str = Field(..., description="CSS selector to wait for")
    timeout_ms: int = Field(default=10000, description="Timeout in milliseconds")


class GetPageContentInput(BaseModel):
    selector: str = Field(default="body", description="CSS selector to extract")


# ============================================================================
# Tools
# ============================================================================

class NavigateTool(BaseTool):
    name: str = "navigate"
    description: str = "Navigate to a URL"
    args_schema: Type[BaseModel] = NavigateInput

    def _run(self, url: str) -> str:
        try:
            page = get_page()
            page.goto(url, wait_until="networkidle", timeout=30000)
            logger.info(f"[Navigate] Navigated to {url}")
            return f"Successfully navigated to {url}"
        except Exception as e:
            logger.error(f"[Navigate] Error: {e}")
            return f"Failed to navigate to {url}: {str(e)}"


class ClickTool(BaseTool):
    name: str = "click"
    description: str = "Click an element by CSS selector"
    args_schema: Type[BaseModel] = ClickInput

    def _run(self, selector: str, timeout_ms: int = 5000) -> str:
        try:
            page = get_page()
            page.click(selector, timeout=timeout_ms)
            logger.info(f"[Click] Clicked {selector}")
            time.sleep(0.5)  # Brief pause after click
            return f"Successfully clicked {selector}"
        except Exception as e:
            logger.error(f"[Click] Error: {e}")
            return f"Failed to click {selector}: {str(e)}"


class FillTool(BaseTool):
    name: str = "fill"
    description: str = "Fill an input field with text (human-like typing)"
    args_schema: Type[BaseModel] = FillInput

    def _run(self, selector: str, text: str, delay_ms: int = 50) -> str:
        try:
            page = get_page()
            # Clear existing text first
            page.fill(selector, "")
            time.sleep(0.2)
            
            # Type with human-like delay
            for char in text:
                page.type(selector, char, delay=delay_ms)
            
            logger.info(f"[Fill] Filled {selector} with {len(text)} characters")
            return f"Successfully filled {selector}"
        except Exception as e:
            logger.error(f"[Fill] Error: {e}")
            return f"Failed to fill {selector}: {str(e)}"


class ScreenshotTool(BaseTool):
    name: str = "screenshot"
    description: str = "Take a full-page screenshot"
    args_schema: Type[BaseModel] = ScreenshotInput

    def _run(self, path: str = "") -> str:
        try:
            page = get_page()
            
            if not path:
                # Generate temp path
                path = os.path.join(tempfile.gettempdir(), f"screenshot_{int(time.time())}.png")

            page.screenshot(path=path, full_page=True)
            logger.info(f"[Screenshot] Saved to {path}")
            return f"Screenshot saved to {path}"
        except Exception as e:
            logger.error(f"[Screenshot] Error: {e}")
            return f"Failed to take screenshot: {str(e)}"


class DetectTwoFATool(BaseTool):
    name: str = "detect_2fa"
    description: str = "Detect if the page requires 2FA verification"
    args_schema: Type[BaseModel] = DetectTwoFAInput

    def _run(self, timeout_ms: int = 5000) -> str:
        try:
            page = get_page()
            
            # Common 2FA selectors
            otp_selectors = [
                "input[name='otp']",
                "input[name='code']",
                "input[name='verification_code']",
                "input[aria-label*='code' i]",
                "input[aria-label*='verification' i]",
                "input[placeholder*='code' i]",
                "input[placeholder*='verification' i]",
                "#2fa-code",
                "[data-testid='otp-input']",
            ]
            
            for selector in otp_selectors:
                try:
                    if page.is_visible(selector, timeout=timeout_ms):
                        logger.warning(f"[2FA] Detected 2FA prompt: {selector}")
                        return f"2FA detected: {selector}"
                except:
                    pass
            
            logger.info("[2FA] No 2FA prompt detected")
            return "No 2FA prompt detected"
        except Exception as e:
            logger.error(f"[2FA] Error: {e}")
            return f"Error detecting 2FA: {str(e)}"


class WaitForTool(BaseTool):
    name: str = "wait_for"
    description: str = "Wait for an element to appear on the page"
    args_schema: Type[BaseModel] = WaitForInput

    def _run(self, selector: str, timeout_ms: int = 10000) -> str:
        try:
            page = get_page()
            page.wait_for_selector(selector, timeout=timeout_ms)
            logger.info(f"[WaitFor] Element {selector} appeared")
            return f"Element {selector} appeared"
        except Exception as e:
            logger.error(f"[WaitFor] Error: {e}")
            return f"Timeout waiting for {selector}: {str(e)}"


class GetPageContentTool(BaseTool):
    name: str = "get_page_content"
    description: str = "Get HTML content of a specific element"
    args_schema: Type[BaseModel] = GetPageContentInput

    def _run(self, selector: str = "body") -> str:
        try:
            page = get_page()
            content = page.locator(selector).inner_html()
            # Truncate to 2000 chars for readability
            if len(content) > 2000:
                content = content[:2000] + "... (truncated)"
            logger.info(f"[GetContent] Retrieved content from {selector}")
            return content
        except Exception as e:
            logger.error(f"[GetContent] Error: {e}")
            return f"Failed to get content: {str(e)}"


# ============================================================================
# Tool Registry
# ============================================================================

def get_browser_tools() -> list:
    """Return all browser tools for CrewAI"""
    return [
    NavigateTool(),
    ClickTool(),
        FillTool(),
    ScreenshotTool(),
    DetectTwoFATool(),
        WaitForTool(),
    GetPageContentTool(),
]
