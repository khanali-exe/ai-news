"""
AI Processing Pipeline
----------------------
Takes a raw article and produces structured analysis using the OpenAI API.
STRICT: only use information present in the source text. Never invent facts.
"""
import hashlib
import json
import logging
from typing import Optional

from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import get_settings
from app.services.cache import get_cached_ai_output, set_cached_ai_output

logger = logging.getLogger(__name__)
settings = get_settings()

CATEGORIES = ["models", "research", "tools", "business", "policy", "other"]

SYSTEM_PROMPT = """You are a precise AI news analyst. Your job is to extract structured information
from AI news articles. You must:

1. ONLY use information that is explicitly stated in the article text.
2. NEVER invent, infer, or speculate beyond what is written.
3. If information for a field is not present in the text, return null for that field.
4. Keep all outputs factual and concise.
5. The tl_dr must be 20 words or fewer.

You will return a JSON object with exactly these fields:
- tl_dr: string (≤20 words) or null
- what_happened: string (2-4 sentences, facts only) or null
- why_it_matters: string (1-3 sentences, clear explanation) or null
- potential_use_case: string (1-2 sentences, realistic and grounded) or null
- category: one of ["models", "research", "tools", "business", "policy", "other"] or null
"""

USER_PROMPT_TEMPLATE = """Article title: {title}

Article text:
{content}

Return ONLY valid JSON with the fields described. Do not include any other text."""


def _url_hash(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()[:32]


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def _call_openai(title: str, content: str) -> dict:
    client = OpenAI(
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
        timeout=settings.ai_timeout,
    )

    response = client.chat.completions.create(
        model=settings.ai_model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": USER_PROMPT_TEMPLATE.format(
                    title=title,
                    content=content[:6000],  # Hard cap to control tokens
                ),
            },
        ],
        temperature=0.1,  # Low temperature = less hallucination
        max_tokens=800,
    )

    raw = response.choices[0].message.content
    return json.loads(raw)


def _validate_output(data: dict) -> dict:
    """Ensure all expected fields exist with correct types. Strip unexpected keys."""
    valid = {}

    tl_dr = data.get("tl_dr")
    if isinstance(tl_dr, str) and tl_dr.strip():
        # Enforce word limit
        words = tl_dr.split()
        valid["tl_dr"] = " ".join(words[:20]) if len(words) > 20 else tl_dr.strip()
    else:
        valid["tl_dr"] = None

    for field in ("what_happened", "why_it_matters", "potential_use_case"):
        val = data.get(field)
        valid[field] = val.strip() if isinstance(val, str) and val.strip() else None

    cat = data.get("category")
    valid["category"] = cat if cat in CATEGORIES else "other"

    return valid


def process_article(
    article_id: int,
    title: str,
    url: str,
    raw_content: Optional[str],
) -> Optional[dict]:
    """
    Run the AI processing pipeline for one article.
    Returns structured dict on success, None on failure.
    Caches results to avoid duplicate API calls.
    """
    if not raw_content or len(raw_content.strip()) < 100:
        logger.warning("Article %d has insufficient content, skipping AI processing", article_id)
        return None

    url_hash = _url_hash(url)

    # Check cache first
    cached = get_cached_ai_output(url_hash)
    if cached:
        logger.info("Cache hit for article %d", article_id)
        return cached

    try:
        raw_output = _call_openai(title, raw_content)
        validated = _validate_output(raw_output)

        # Cache the result
        set_cached_ai_output(url_hash, validated)
        logger.info("AI processing complete for article %d (category=%s)", article_id, validated.get("category"))
        return validated

    except json.JSONDecodeError as e:
        logger.error("AI returned invalid JSON for article %d: %s", article_id, e)
        return None
    except Exception as e:
        logger.error("AI processing failed for article %d: %s", article_id, e)
        raise
