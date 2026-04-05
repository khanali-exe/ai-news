"""
Fact-Checking Layer
-------------------
Second AI pass: validates generated content against the source article.
If the analysis contains claims not supported by the source text, it is rejected.
"""
import json
import logging
from typing import Optional

from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

FACT_CHECK_SYSTEM = """You are a strict fact-checker for AI news summaries.

You will receive:
1. The original article text.
2. An AI-generated analysis of that article.

Your job is to verify that every claim in the analysis is directly supported by the original article.

Rules:
- If ANY claim in the analysis cannot be verified from the article text → is_valid: false
- If the analysis contains invented details, exaggerations, or speculation → is_valid: false
- If the analysis is factually accurate and only uses information from the article → is_valid: true
- A null field is not an error.

Return ONLY valid JSON:
{
  "is_valid": true or false,
  "reason": "brief explanation (1-2 sentences)"
}"""

FACT_CHECK_USER_TEMPLATE = """Original article (title + text):
TITLE: {title}
TEXT: {content}

---

AI-generated analysis:
TL;DR: {tl_dr}
What happened: {what_happened}
Why it matters: {why_it_matters}
Potential use case: {potential_use_case}
Category: {category}

Is this analysis factually accurate based on the original article?"""


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=8))
def _call_fact_check(title: str, content: str, analysis: dict) -> dict:
    client = OpenAI(
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
        timeout=settings.ai_timeout,
    )

    response = client.chat.completions.create(
        model=settings.ai_model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": FACT_CHECK_SYSTEM},
            {
                "role": "user",
                "content": FACT_CHECK_USER_TEMPLATE.format(
                    title=title,
                    content=content[:4000],
                    tl_dr=analysis.get("tl_dr") or "N/A",
                    what_happened=analysis.get("what_happened") or "N/A",
                    why_it_matters=analysis.get("why_it_matters") or "N/A",
                    potential_use_case=analysis.get("potential_use_case") or "N/A",
                    category=analysis.get("category") or "N/A",
                ),
            },
        ],
        temperature=0.0,
        max_tokens=200,
    )

    return json.loads(response.choices[0].message.content)


def fact_check_article(
    title: str,
    raw_content: str,
    analysis: dict,
) -> dict:
    """
    Run the fact-check validation pass.
    Returns {"is_valid": bool, "reason": str}.
    On error, defaults to invalid (conservative approach).
    """
    if not raw_content or len(raw_content.strip()) < 100:
        return {"is_valid": False, "reason": "Insufficient source content to verify against."}

    try:
        result = _call_fact_check(title, raw_content, analysis)
        is_valid = bool(result.get("is_valid", False))
        reason = str(result.get("reason", ""))[:500]
        logger.info("Fact-check result for '%s': valid=%s", title[:60], is_valid)
        return {"is_valid": is_valid, "reason": reason}
    except Exception as e:
        logger.error("Fact-check failed for '%s': %s", title[:60], e)
        return {"is_valid": False, "reason": f"Fact-check error: {e}"}
