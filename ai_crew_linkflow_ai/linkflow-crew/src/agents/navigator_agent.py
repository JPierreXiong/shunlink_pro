"""
LinkFlow AI — Navigator Agent

The Navigator agent is responsible for all browser automation:
- Logging into the target platform
- Navigating to the post creation page
- Filling in the title and article content
- Inserting the anchor text with the backlink URL
- Clicking the publish/submit button
- Detecting 2FA prompts and reporting them
- Taking a screenshot as proof of submission
"""

from crewai import Agent
from src.tools.browser_tools import ALL_BROWSER_TOOLS


def create_navigator_agent(llm=None) -> Agent:
    """
    Create and return the Navigator agent.

    Args:
        llm: Optional LLM instance. If None, uses the default from
             OPENAI_MODEL_NAME / OPENAI_API_KEY env vars.
    """
    kwargs = dict(
        role="Web Platform Navigator",
        goal=(
            "Successfully submit a backlink to the target web platform by logging in, "
            "creating a new post with the provided article content and anchor text, "
            "and publishing it. If a 2FA prompt is detected at any point, immediately "
            "stop and report it. Upon success, take a screenshot as proof."
        ),
        backstory=(
            "You are an expert at navigating web platforms and automating form submissions. "
            "You have years of experience with WordPress, Blogger, Medium, Tumblr, and dozens "
            "of other blogging and social platforms. You know exactly which buttons to click "
            "and which form fields to fill. You are patient — if a selector doesn't work, "
            "you use get_page_content to inspect the live page and find the correct element. "
            "You always act like a real human user: you pause between actions, type naturally, "
            "and never rush. You NEVER give up without trying at least two alternative selectors. "
            "If you see any 2FA or verification prompt, you IMMEDIATELY call detect_2fa and "
            "report the result — you never try to bypass security checks."
        ),
        tools=ALL_BROWSER_TOOLS,
        verbose=True,
        max_iter=25,
        max_retry_limit=3,
        respect_context_window=True,
        allow_delegation=False,
    )
    if llm:
        kwargs["llm"] = llm
    return Agent(**kwargs)
