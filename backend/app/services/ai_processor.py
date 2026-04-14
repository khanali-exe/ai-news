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

SYSTEM_PROMPT = """You are a senior AI research analyst curating a high-signal feed for AI engineers,
researchers, and founders. Your audience reads this to track real progress in AI — not tutorials,
not marketing, not general tech.

━━ HARD REJECT — set is_ai_relevant: false ━━
These article types must NEVER pass, no exceptions:
• Tutorials, how-to guides, walkthroughs, step-by-step instructions
• "How Company X uses AI" — customer stories, case studies, enterprise integrations
• Marketing copy: product announcements with no new technical capability
• Partnership/integration announcements (e.g. "X integrates with Y")
• General tech news: gadgets, phones, gaming, Linux, cloud storage, social media
• Earnings reports, HR/layoff news, organizational changes
• Events, conferences, webinars, award announcements
• Weekly digests, newsletters, reading lists, curated link roundups
• Opinion/commentary without concrete new AI developments
• Anything where AI is the tool being used — not the subject of advancement

━━ ACCEPT — set is_ai_relevant: true ━━
ONLY these content types pass:
• New model releases: LLMs, multimodal models, diffusion models, audio/video models
• Research papers: novel architectures, training methods, capability benchmarks
• Technical breakthroughs: new reasoning, alignment, agent, or emergent behavior findings
• New developer tools: APIs, frameworks, SDKs with genuinely new AI capabilities
• AI safety/policy: concrete regulation, legislation, or governance decisions
• Hardware/compute advances directly enabling AI progress (chips, infrastructure)
• Major AI lab strategies with direct model/capability implications (funding rounds at AI labs)

━━ WRITING RULES ━━
• Lead with the most important fact — not the company name
• Be specific: name the model, metric, benchmark, or method
• Explain what changed and why it matters to the field
• No filler: avoid "it is worth noting", "could potentially", "in conclusion"
• Use plain English — technical terms only when essential
• ONLY use information from the article text. Return null for missing fields.

Return a JSON object with EXACTLY these fields:
{
  "is_ai_relevant": boolean,
  "display_title": "Rewrite the article title in your own words — same meaning, fresh phrasing. Max 15 words. No quotes around it.",
  "tl_dr": "≤20 word punchy analyst headline — lead with the most surprising fact",
  "what_happened": "2-3 sentences of concrete facts: what was built/released/discovered",
  "why_it_matters": "2-3 sentences: what this changes or signals for the field",
  "potential_use_case": "1-2 sentences: most impactful real-world application",
  "category": "one of: models | research | tools | business | policy | other"
}"""

USER_PROMPT_TEMPLATE = """Article title: {title}

Article text:
{content}

Return ONLY valid JSON. No other text."""


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
                    content=content[:6000],
                ),
            },
        ],
        temperature=0.1,
        max_tokens=800,
    )

    raw = response.choices[0].message.content
    return json.loads(raw)


def _validate_output(data: dict) -> dict:
    valid = {}

    valid["is_ai_relevant"] = data.get("is_ai_relevant") is True  # must be explicitly True

    dt = data.get("display_title")
    if isinstance(dt, str) and dt.strip():
        words = dt.split()
        valid["display_title"] = " ".join(words[:15]) if len(words) > 15 else dt.strip()
    else:
        valid["display_title"] = None

    tl_dr = data.get("tl_dr")
    if isinstance(tl_dr, str) and tl_dr.strip():
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
        logger.warning("Article %d has insufficient content, skipping", article_id)
        return None

    content = raw_content.strip()
    url_hash = _url_hash(url)

    cached = get_cached_ai_output(url_hash)
    if cached:
        logger.info("Cache hit for article %d", article_id)
        return cached

    try:
        raw_output = _call_openai(title, content)
        validated = _validate_output(raw_output)

        set_cached_ai_output(url_hash, validated)
        logger.info(
            "AI processing complete for article %d (relevant=%s category=%s)",
            article_id, validated.get("is_ai_relevant"), validated.get("category")
        )
        return validated

    except json.JSONDecodeError as e:
        logger.error("AI returned invalid JSON for article %d: %s", article_id, e)
        return None
    except Exception as e:
        logger.error("AI processing failed for article %d: %s", article_id, e)
        raise
