"""Redis cache helpers with JSON serialisation."""
import json
import logging
from typing import Any, Optional

import redis as redis_lib

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Module-level Redis client — lazy-connect
_client: Optional[redis_lib.Redis] = None


def get_redis() -> redis_lib.Redis:
    global _client
    if _client is None:
        url = settings.redis_url
        if url.startswith("rediss://"):
            # ssl_cert_reqs=None (falsy) → SSLConnection sets ssl.CERT_NONE directly,
            # bypassing string validation which rejects URL-level "CERT_NONE" params
            _client = redis_lib.from_url(
                url,
                decode_responses=True,
                ssl_cert_reqs=None,
                ssl_check_hostname=False,
            )
        else:
            _client = redis_lib.from_url(url, decode_responses=True)
    return _client


# ─── Key helpers ──────────────────────────────────────────────────────────────

def _key_article(article_id: int) -> str:
    return f"article:{article_id}"


def _key_article_slug(slug: str) -> str:
    return f"article_slug:{slug}"


def _key_article_list(page: int, page_size: int, category: str, verification: str) -> str:
    return f"article_list:{page}:{page_size}:{category}:{verification}"


def _key_ai_output(url_hash: str) -> str:
    return f"ai_output:{url_hash}"


# ─── Generic helpers ──────────────────────────────────────────────────────────

def cache_get(key: str) -> Optional[Any]:
    try:
        raw = get_redis().get(key)
        if raw:
            return json.loads(raw)
    except Exception as e:
        logger.warning("Cache GET failed for %s: %s", key, e)
    return None


def cache_set(key: str, value: Any, ttl: int) -> None:
    try:
        get_redis().setex(key, ttl, json.dumps(value, default=str))
    except Exception as e:
        logger.warning("Cache SET failed for %s: %s", key, e)


def cache_delete(key: str) -> None:
    try:
        get_redis().delete(key)
    except Exception as e:
        logger.warning("Cache DELETE failed for %s: %s", key, e)


def cache_delete_pattern(pattern: str) -> None:
    """Delete all keys matching a pattern (uses SCAN, safe for production)."""
    try:
        client = get_redis()
        cursor = 0
        while True:
            cursor, keys = client.scan(cursor, match=pattern, count=100)
            if keys:
                client.delete(*keys)
            if cursor == 0:
                break
    except Exception as e:
        logger.warning("Cache DELETE pattern %s failed: %s", pattern, e)


# ─── Domain-specific helpers ──────────────────────────────────────────────────

def get_cached_article(article_id: int) -> Optional[dict]:
    return cache_get(_key_article(article_id))


def set_cached_article(article_id: int, data: dict, ttl: int = None) -> None:
    ttl = ttl or settings.cache_ttl_article
    cache_set(_key_article(article_id), data, ttl)


def invalidate_article(article_id: int) -> None:
    cache_delete(_key_article(article_id))
    cache_delete_pattern("article_list:*")


def get_cached_ai_output(url_hash: str) -> Optional[dict]:
    return cache_get(_key_ai_output(url_hash))


def set_cached_ai_output(url_hash: str, data: dict, ttl: int = 604800) -> None:
    """Cache AI outputs for 7 days — they never change for a given article."""
    cache_set(_key_ai_output(url_hash), data, ttl)


def invalidate_ai_output(url_hash: str) -> None:
    """Force re-processing by clearing cached AI output for a URL."""
    cache_delete(_key_ai_output(url_hash))


def invalidate_all_ai_outputs() -> None:
    """Clear all cached AI outputs — use when prompt changes require reprocessing."""
    cache_delete_pattern("ai_output:*")
