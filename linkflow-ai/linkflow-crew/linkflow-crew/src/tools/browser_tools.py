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

    return _page


def close_browser() -> None:
    """Clean up browser resources."""
    global _playwright, _browser, _context, _page
    try:
        if _page and not _page.is_closed():
            _page.close()
        if _context:
            _context.close()
        if _browser:
            _browser.close()
        if _playwright:
            _playwright.stop()
    except Exception as e:
        logger.warning(f"Browser cleanup error: {e}")
    finally:
        _playwright = _browser = _context = _page = None


def _human_type(page: Page, selector: str, text: str) -> None:
    """Type text with random character-level delays to mimic human input."""
    page.click(selector)
    time.sleep(random.uniform(0.2, 0.5))
    page.keyboard.press("Control+a")  # Clear existing content
    page.keyboard.press("Delete")
    for char in text:
        page.keyboard.type(char)
        time.sleep(random.uniform(0.04, 0.12))


# ============================================================
# TOOL: Navigate
# ============================================================

class NavigateInput(BaseModel):
    url: str = Field(..., description="Full URL to navigate to, including https://")


class NavigateTool(BaseTool):
    name: str = "navigate_browser"
    description: str = (
        "Navigate the browser to a URL. Use this to open login pages, "
        "post creation pages, or any web page needed for backlink submission."
    )
    args_schema: Type[BaseModel] = NavigateInput

    def _run(self, url: str) -> str:
        try:
            page = get_page()
            page.goto(url, wait_until="domcontentloaded", timeout=30000)
            time.sleep(random.uniform(1.0, 2.5))
            title = page.title()
            return f"Navigated to {url} — Page title: '{title}'"
        except Exception as e:
            return f"ERROR navigating to {url}: {e}"


# ============================================================
# TOOL: Fill Form Field
# ============================================================

class FillFormInput(BaseModel):
    selector: str = Field(..., description="CSS selector for the input or textarea to fill")
    text: str = Field(..., description="Text content to type into the field")


class FillFormTool(BaseTool):
    name: str = "fill_form_field"
    description: str = (
        "Fill a form input or textarea with text using human-like typing. "
        "Provide a CSS selector and the text to enter. Use for username, "
        "password, title, content, and anchor text fields."
    )
    args_schema: Type[BaseModel] = FillFormInput

    def _run(self, selector: str, text: str) -> str:
        try:
            page = get_page()
            page.wait_for_selector(selector, timeout=15000)
            _human_type(page, selector, text)
            return f"Filled '{selector}' with text ({len(text)} chars)"
        except Exception as e:
            return f"ERROR filling field '{selector}': {e}"


# ============================================================
# TOOL: Click Element
# ============================================================

class ClickInput(BaseModel):
    selector: str = Field(..., description="CSS selector for the element to click")
    wait_after_ms: int = Field(1500, description="Milliseconds to wait after clicking")


class ClickTool(BaseTool):
    name: str = "click_element"
    description: str = (
        "Click a button, link, or any element on the page using a CSS selector. "
        "Use for submit buttons, login buttons, publish buttons, etc."
    )
    args_schema: Type[BaseModel] = ClickInput

    def _run(self, selector: str, wait_after_ms: int = 1500) -> str:
        try:
            page = get_page()
            page.wait_for_selector(selector, timeout=15000)
            time.sleep(random.uniform(0.3, 0.7))
            page.click(selector)
            time.sleep(wait_after_ms / 1000.0)
            return f"Clicked element '{selector}'"
        except Exception as e:
            return f"ERROR clicking '{selector}': {e}"


# ============================================================
# TOOL: Screenshot
# ============================================================

class ScreenshotInput(BaseModel):
    task_id: str = Field(..., description="Task UUID used to name the screenshot file")


class ScreenshotTool(BaseTool):
    name: str = "take_screenshot"
    description: str = (
        "Take a full-page screenshot of the current browser page as proof of "
        "successful backlink submission. Returns the local file path of the PNG."
    )
    args_schema: Type[BaseModel] = ScreenshotInput

    def _run(self, task_id: str) -> str:
        try:
            page = get_page()
            tmp_path = os.path.join(
                tempfile.gettempdir(), f"linkflow_{task_id}_{int(time.time())}.png"
            )

            # ── Anti-forgery watermark ────────────────────────────────────────
            # Inject a tamper-proof overlay before screenshotting.
            # Contains Task ID + UTC timestamp — impossible to fake retroactively.
            utc_now = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
            page.evaluate(f"""
                () => {{
                    const existing = document.getElementById('_lf_watermark');
                    if (existing) existing.remove();
                    const el = document.createElement('div');
                    el.id = '_lf_watermark';
                    el.style.cssText = `
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        z-index: 999999;
                        background: rgba(8, 12, 20, 0.92);
                        color: #00D4FF;
                        font-family: monospace;
                        font-size: 11px;
                        padding: 6px 12px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-top: 1px solid #1A2540;
                        backdrop-filter: blur(4px);
                    `;
                    el.innerHTML = `
                        <span>✓ Verified by <strong>LinkFlow AI</strong></span>
                        <span>Task ID: <strong>{task_id}</strong></span>
                        <span>{utc_now}</span>
                    `;
                    document.body.appendChild(el);
                }}
            """)
            time.sleep(0.3)  # Let the overlay render
            # ─────────────────────────────────────────────────────────────────

            page.screenshot(path=tmp_path, full_page=True)
            logger.info(f"Screenshot saved: {tmp_path}")
            return f"SCREENSHOT_PATH:{tmp_path}"
        except Exception as e:
            return f"ERROR taking screenshot: {e}"


# ============================================================
# TOOL: Detect 2FA
# ============================================================

class DetectTwoFAInput(BaseModel):
    pass


class DetectTwoFATool(BaseTool):
    name: str = "detect_2fa"
    description: str = (
        "Check if the current browser page is showing a 2FA / verification "
        "code prompt. Returns 'NEED_2FA:<message>' if detected, or 'CLEAR' if not."
    )
    args_schema: Type[BaseModel] = DetectTwoFAInput

    def _run(self) -> str:
        try:
            page = get_page()
            content = page.content().lower()
            title = page.title()
            triggers = [
                "2-step verification",
                "2fa",
                "two-factor",
                "verification code",
                "authenticator",
                "verify your identity",
                "enter the code",
                "security code",
                "phone number verification",
                "sms code",
                "confirm it's you",
            ]
            for trigger in triggers:
                if trigger in content:
                    return f"NEED_2FA:Page '{title}' requires 2FA — trigger: '{trigger}'"
            return "CLEAR"
        except Exception as e:
            return f"ERROR checking for 2FA: {e}"


# ============================================================
# TOOL: Get Page Content (for AI selector healing)
# ============================================================

class GetPageContentInput(BaseModel):
    max_chars: int = Field(
        3000,
        description="Max characters of DOM snapshot to return (keep low to save tokens)"
    )


class GetPageContentTool(BaseTool):
    name: str = "get_page_content"
    description: str = (
        "Get a compact snapshot of all interactive elements on the current page "
        "(buttons, inputs, links). Use this when a CSS selector fails and you "
        "need to find the correct selector by inspecting available elements."
    )
    args_schema: Type[BaseModel] = GetPageContentInput

    def _run(self, max_chars: int = 3000) -> str:
        try:
            page = get_page()
            elements = page.evaluate("""
                () => {
                    const els = document.querySelectorAll(
                        'button, input, textarea, a[href], [role="button"], [role="textbox"], select'
                    );
                    return Array.from(els).slice(0, 60).map(el => ({
                        tag: el.tagName,
                        id: el.id ? '#' + el.id : '',
                        cls: '.' + Array.from(el.classList).slice(0,3).join('.'),
                        text: el.textContent.trim().substring(0, 40),
                        placeholder: el.placeholder || '',
                        type: el.type || '',
                        name: el.name || '',
                        href: el.href ? el.href.substring(0, 60) : ''
                    }));
                }
            """)
            snapshot = str(elements)[:max_chars]
            return f"PAGE_ELEMENTS:{snapshot}"
        except Exception as e:
            return f"ERROR getting page content: {e}"


# ============================================================
# TOOL: Wait For Selector
# ============================================================

class WaitForInput(BaseModel):
    selector: str = Field(..., description="CSS selector to wait for")
    timeout_ms: int = Field(15000, description="Max milliseconds to wait")


class WaitForTool(BaseTool):
    name: str = "wait_for_element"
    description: str = (
        "Wait for a specific element to appear on the page. "
        "Useful after clicking 'Publish' to wait for a success confirmation element."
    )
    args_schema: Type[BaseModel] = WaitForInput

    def _run(self, selector: str, timeout_ms: int = 15000) -> str:
        try:
            page = get_page()
            page.wait_for_selector(selector, timeout=timeout_ms)
            return f"Element '{selector}' is now visible on the page"
        except Exception as e:
            return f"TIMEOUT waiting for '{selector}': {e}"


# ============================================================
# TOOL: Get Current URL
# ============================================================

class GetCurrentURLInput(BaseModel):
    pass


class GetCurrentURLTool(BaseTool):
    name: str = "get_current_url"
    description: str = (
        "Get the current URL of the browser. Use after publishing to capture "
        "the live backlink URL for storing in the database."
    )
    args_schema: Type[BaseModel] = GetCurrentURLInput

    def _run(self) -> str:
        try:
            page = get_page()
            return f"CURRENT_URL:{page.url}"
        except Exception as e:
            return f"ERROR getting current URL: {e}"


# Convenience: all tools as a list for use in Agent definition
ALL_BROWSER_TOOLS = [
    NavigateTool(),
    FillFormTool(),
    ClickTool(),
    ScreenshotTool(),
    DetectTwoFATool(),
    GetPageContentTool(),
    WaitForTool(),
    GetCurrentURLTool(),
]

