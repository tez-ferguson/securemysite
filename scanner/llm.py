"""Fix-prompt generation via Moonshot Kimi API (OpenAI-compatible)."""

import os

KIMI_MODEL = os.environ.get("KIMI_MODEL", "kimi-k2.5")
MOONSHOT_BASE_URL = "https://api.moonshot.ai/v1"


def _client():
    from openai import OpenAI

    api_key = os.environ.get("MOONSHOT_API_KEY")
    if not api_key:
        return None
    return OpenAI(api_key=api_key, base_url=MOONSHOT_BASE_URL, timeout=20.0)


def generate_fix_prompt(finding: dict, *, context: str = "code") -> str:
    """Generate a Lovable/Cursor-friendly fix prompt using Kimi."""
    client = _client()
    if not client:
        loc = finding["file"]
        if finding.get("line"):
            loc = f"{loc} at line {finding['line']}"
        return (
            f"Fix the following security issue in {loc}: "
            f"{finding['description']}. Apply security best practices."
        )

    if context == "passive":
        user_content = f"""Generate a concise fix prompt for this infrastructure/hosting security issue.
Format for pasting into Lovable, Bolt, Vercel settings, or Cursor.
Focus on headers, TLS, DNS, or deployment config — not source code refactors unless needed.
Start with "Fix the following security issue:" and keep under 150 words.

Issue type: {finding['type']}
Severity: {finding['severity']}
Location: {finding['file']}
Description: {finding['description']}
Context: {finding['snippet']}"""
    else:
        user_content = f"""Generate a concise fix prompt for the following security issue, formatted for pasting directly into Lovable, Bolt, or Cursor.
The prompt should tell the AI exactly what to do to fix the issue. Be specific about file names, line numbers, and the exact change needed.
Start with "Fix the following security issue:" and keep it under 150 words.

Issue type: {finding['type']}
Severity: {finding['severity']}
File: {finding['file']}
Line: {finding['line']}
Description: {finding['description']}
Code snippet: {finding['snippet']}"""

    try:
        completion = client.chat.completions.create(
            model=KIMI_MODEL,
            messages=[{"role": "user", "content": user_content}],
            max_tokens=400,
            extra_body={"thinking": {"type": "disabled"}},
        )
        return completion.choices[0].message.content or ""
    except Exception:
        loc = finding["file"]
        if finding.get("line"):
            loc = f"{loc} at line {finding['line']}"
        return (
            f"Fix the following security issue in {loc}: "
            f"{finding['description']}. Apply security best practices."
        )
