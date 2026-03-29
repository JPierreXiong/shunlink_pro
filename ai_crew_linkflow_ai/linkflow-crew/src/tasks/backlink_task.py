"""
LinkFlow AI — CrewAI Task Definitions

Defines the two tasks that make up each backlink submission:
  1. content_preparation_task  — Content Specialist formats the article
  2. backlink_submission_task  — Navigator submits it to the platform

Tasks are created fresh for each job so they include the specific
target URL, anchor text, and platform config for that task.
"""

import json
from crewai import Task
from crewai import Agent


def create_content_preparation_task(
    content_agent: Agent,
    target_url: str,
    anchor_text: str,
    article_content: str,
    platform_name: str,
) -> Task:
    """
    Task 1: Have the Content Specialist adapt the article for the platform
    and embed the anchor text / backlink naturally.
    """
    return Task(
        name="content_preparation",
        description=f"""
            Prepare the article content for submission to {platform_name}.

            TARGET BACKLINK URL: {target_url}
            ANCHOR TEXT: {anchor_text}
            PLATFORM: {platform_name}

            RAW ARTICLE CONTENT PROVIDED BY CLIENT:
            ---
            {article_content or 'No content provided — write a 400-word original article on a topic relevant to the anchor text.'}
            ---

            Your job:
            1. Write or adapt the article to suit {platform_name}'s style and audience.
            2. Embed the anchor text "{anchor_text}" as a natural hyperlink pointing to {target_url}.
               Format it as: <a href="{target_url}">{anchor_text}</a>
            3. Write a compelling, specific title (not generic).
            4. Keep the body between 300-600 words.
            5. Make sure the content does NOT look like spam.

            Output a JSON object with exactly these two keys:
            {{
              "title": "Your Article Title Here",
              "body": "Full article body with the hyperlink embedded..."
            }}
        """,
        expected_output=(
            'A JSON object with "title" (string) and "body" (string) keys. '
            "The body must contain the anchor text as an HTML hyperlink to the target URL. "
            "Body must be 300-600 words."
        ),
        agent=content_agent,
        guardrail=(
            "The output must be valid JSON with 'title' and 'body' keys. "
            f"The body must contain the text '{anchor_text}' and the URL '{target_url}'. "
            "The body must be at least 200 words."
        ),
        guardrail_max_retries=3,
    )


def create_backlink_submission_task(
    navigator_agent: Agent,
    platform_name: str,
    platform_base_url: str,
    selector_config: dict,
    task_id: str,
    platform_credentials: dict = None,
) -> Task:
    """
    Task 2: Navigator logs into the platform and submits the prepared content.
    This task uses the output of content_preparation_task as context.
    """
    config_str = json.dumps(selector_config, indent=2)
    creds_note = ""
    if platform_credentials:
        creds_note = f"""
            LOGIN CREDENTIALS:
            Username/Email: {platform_credentials.get('username', 'N/A')}
            Password: {platform_credentials.get('password', 'N/A')}
        """

    return Task(
        name="backlink_submission",
        description=f"""
            Submit the prepared article (from the previous task) to {platform_name}.

            PLATFORM BASE URL: {platform_base_url}
            TASK ID (for screenshot naming): {task_id}

            {creds_note}

            PLATFORM SELECTOR CONFIG:
            {config_str}

            SUBMISSION STEPS:
            1. Call navigate_browser with the login_url from the selector config
               (prepend platform_base_url if the URL is relative).
            2. Fill the username and password fields using fill_form_field.
            3. Click the submit/login button using click_element.
            4. IMMEDIATELY call detect_2fa. If result starts with 'NEED_2FA:',
               output exactly: "STATUS:NEED_2FA:<the message>" and STOP.
            5. Navigate to the new_post_url from the selector config.
            6. Fill the title field with the title from the previous task.
            7. Fill the content field with the body from the previous task.
            8. Click the publish button.
            9. Wait for any success indicator if one is specified in the config.
            10. Call get_current_url and record the live link URL.
            11. Call take_screenshot with task_id='{task_id}'.
            12. Output: "STATUS:SUCCESS|SCREENSHOT:<path>|LIVE_URL:<url>"

            SELF-HEALING:
            If any selector fails, call get_page_content to inspect all
            interactive elements on the page, then choose the correct selector
            based on what you see. Try at least 2 alternative selectors before
            giving up on a step.

            ERROR OUTPUT FORMAT:
            If submission fails after all retries: "STATUS:FAILED:<error message>"
        """,
        expected_output=(
            "One of:\n"
            "  STATUS:SUCCESS|SCREENSHOT:/tmp/linkflow_<task_id>.png|LIVE_URL:https://...\n"
            "  STATUS:NEED_2FA:<description of what 2FA is being asked>\n"
            "  STATUS:FAILED:<error description>"
        ),
        agent=navigator_agent,
    )


