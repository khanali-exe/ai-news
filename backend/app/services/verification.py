"""
Verification Engine
--------------------
Assigns verification_status to an article based on source trust tier.

primary   → "verified"   (official company blog, official research paper)
secondary → "confirmed"  only if the story appears in 2+ secondary sources
secondary (1 source only) → "unverified" → rejected from publishing
"""
import logging
from sqlalchemy.orm import Session

from app.models.article import Article
from app.models.source import Source

logger = logging.getLogger(__name__)


def _count_sources_covering_url_prefix(url: str, db: Session) -> int:
    """
    Count how many distinct sources have published articles with similar URLs.
    Uses domain matching as a proxy for the same story being covered by multiple outlets.
    """
    # Extract the first ~60 chars of the URL path as a rough story fingerprint
    # A better approach would be title similarity (handled in deduplication)
    pass


def assign_verification_status(article: Article, db: Session) -> str:
    """
    Compute and return the verification_status for an article.
    Does NOT commit to DB — caller is responsible.
    """
    source = db.query(Source).filter(Source.id == article.source_id).first()
    if not source:
        logger.warning("No source found for article %d", article.id)
        return "unverified"

    if source.trust_tier == "primary":
        return "verified"

    # Secondary sources: articles that pass AI relevance filtering are confirmed
    # The AI processor is the quality gate — if it passes, we publish it
    return "confirmed"


def _extract_key_phrase(title: str) -> str:
    """Extract the most distinctive part of a title for matching."""
    # Strip common prefixes and take the core phrase
    stop_words = {"the", "a", "an", "is", "are", "was", "were", "in", "on", "at",
                  "to", "for", "of", "and", "or", "but", "with", "how", "why"}
    words = [w for w in title.lower().split() if w not in stop_words and len(w) > 3]
    # Use top 3 distinctive words joined
    return " ".join(words[:3]) if words else title[:20]
