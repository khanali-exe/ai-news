"""RSS scraper — fetches articles from configured sources."""
import hashlib
import logging
import re
from datetime import datetime, timezone
from typing import Optional

import feedparser
import httpx
from bs4 import BeautifulSoup
from slugify import slugify
from sqlalchemy.orm import Session

from app.models.article import Article
from app.models.source import Source
from app.models.scrape_log import ScrapeLog

logger = logging.getLogger(__name__)

FETCH_TIMEOUT = 15
MAX_CONTENT_CHARS = 8000
MAX_ENTRIES_PER_SOURCE = 30

# ── Keyword signals ────────────────────────────────────────────────────────────

# Title must contain at least one INCLUDE signal OR pass without an EXCLUDE signal
# If an EXCLUDE signal is found → skip immediately
EXCLUDE_TITLE_EXACT_PREFIXES = (
    "how to ", "using ", "working with ", "getting started",
    "introduction to ", "guide to ", "learn to ", "tutorial:",
    "prompting ", "personalizing ", "brainstorming with ",
    "writing with ", "top 10 ", "top 5 ", "best ",
    "a beginner", "beginners guide",
)

EXCLUDE_TITLE_KEYWORDS = (
    " tutorial", " tutorials", " walkthrough", " cheat sheet",
    "step-by-step", "for beginners", "tips and tricks",
    "in 3 simple steps", "in 5 steps", "for sales teams",
    "for enterprises", "case study", "how i ", "my experience",
    " course", " courses", " certification", " bootcamp",
    "weekly digest", "newsletter", "reading list", "curated",
)

EXCLUDE_URL_SEGMENTS = (
    "/academy/", "/learn/", "/education/", "/tutorial/",
    "/getting-started/", "/docs/", "/documentation/",
    "/course/", "/bootcamp/", "/certification/",
)

# Strong news signals — presence of any of these in title/content is a good sign
NEWS_TITLE_SIGNALS = (
    "announces", "announce", "announced",
    "introduces", "introduce", "introduced",
    "releases", "release", "released",
    "launches", "launch", "launched",
    "unveils", "unveil", "unveiled",
    "researchers", "research", "developed",
    "new model", "new paper", "new study",
    "benchmark", "outperforms", "breakthrough",
    "published", "open-source", "open source",
    "funding", "raises", "acquires",
    "regulation", "policy", "ban", "law",
    "discovered", "finds", "found",
)


def _is_news_title(title: str) -> bool:
    """Return True if the title looks like a news article, not a tutorial/guide."""
    t = title.lower()

    # Hard reject on exclude prefixes
    if any(t.startswith(p) for p in EXCLUDE_TITLE_EXACT_PREFIXES):
        return False

    # Hard reject on exclude keywords
    if any(k in t for k in EXCLUDE_TITLE_KEYWORDS):
        return False

    return True


def _fetch_page(url: str) -> Optional[BeautifulSoup]:
    try:
        resp = httpx.get(url, timeout=FETCH_TIMEOUT, follow_redirects=True,
                         headers={"User-Agent": "Mozilla/5.0 (compatible; AINewsBot/1.0)"})
        resp.raise_for_status()
        return BeautifulSoup(resp.text, "lxml")
    except Exception as e:
        logger.debug("Could not fetch page %s: %s", url, e)
        return None


def _extract_og_image(soup: BeautifulSoup) -> Optional[str]:
    for attr, name in [("property", "og:image"), ("name", "twitter:image")]:
        tag = soup.find("meta", attrs={attr: name})
        if tag and tag.get("content", "").startswith("http"):
            return tag["content"]
    return None


def _fetch_full_text(url: str) -> tuple[Optional[str], Optional[str]]:
    soup = _fetch_page(url)
    if not soup:
        return None, None
    image_url = _extract_og_image(soup)
    for tag in soup(["nav", "footer", "header", "aside", "script", "style", "noscript"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)
    return text[:MAX_CONTENT_CHARS], image_url


def _make_slug(title: str, url: str) -> str:
    base = slugify(title)[:250]
    url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
    return f"{base}-{url_hash}"


def _parse_date(entry) -> Optional[datetime]:
    for attr in ("published_parsed", "updated_parsed"):
        val = getattr(entry, attr, None)
        if val:
            try:
                return datetime(*val[:6], tzinfo=timezone.utc)
            except Exception:
                pass
    return None


def scrape_source(source: Source, db: Session) -> dict:
    log = ScrapeLog(source_id=source.id)
    db.add(log)
    db.commit()
    db.refresh(log)

    try:
        feed = feedparser.parse(source.rss_url)
        if feed.bozo and not feed.entries:
            raise ValueError(f"Malformed feed: {feed.bozo_exception}")

        entries = feed.entries[:MAX_ENTRIES_PER_SOURCE]
        found = len(entries)
        new_count = 0
        skipped = 0

        for entry in entries:
            url = entry.get("link", "").strip()
            title = entry.get("title", "").strip()

            if not url or not title:
                continue

            # ── URL filter ────────────────────────────────────────────────────
            if any(seg in url.lower() for seg in EXCLUDE_URL_SEGMENTS):
                logger.debug("Skipping blocked URL pattern: %s", url)
                skipped += 1
                continue

            # ── Title filter ──────────────────────────────────────────────────
            if not _is_news_title(title):
                logger.debug("Skipping non-news title: %s", title)
                skipped += 1
                continue

            # ── Duplicate check ───────────────────────────────────────────────
            slug = _make_slug(title, url)
            exists = db.query(Article.id).filter(
                (Article.url == url) | (Article.slug == slug)
            ).first()
            if exists:
                continue

            # ── Image from RSS media tags ─────────────────────────────────────
            image_url: Optional[str] = None
            for media in (entry.get("media_content") or entry.get("media_thumbnail") or []):
                u = media.get("url", "")
                if u.startswith("http"):
                    image_url = u
                    break
            for enc in (entry.get("enclosures") or []):
                u = enc.get("href", "")
                if u.startswith("http") and "image" in enc.get("type", "image"):
                    image_url = u
                    break

            # ── Content ───────────────────────────────────────────────────────
            raw_content = (
                entry.get("summary", "")
                or (entry.get("content") or [{}])[0].get("value", "")
            )
            if len(raw_content) < 200 or not image_url:
                fetched_text, fetched_image = _fetch_full_text(url)
                if len(raw_content) < 200 and fetched_text:
                    raw_content = fetched_text
                if not image_url and fetched_image:
                    image_url = fetched_image

            article = Article(
                title=title,
                slug=slug,
                url=url,
                source_id=source.id,
                raw_content=raw_content[:MAX_CONTENT_CHARS] if raw_content else None,
                image_url=image_url,
                published_at=_parse_date(entry),
                processing_status="pending",
                is_published=False,
            )
            db.add(article)
            try:
                db.flush()
                new_count += 1
            except Exception as flush_err:
                db.rollback()
                logger.debug("Skipping duplicate article %s: %s", url, flush_err)

        db.commit()

        log.finished_at = datetime.now(timezone.utc)
        log.articles_found = found
        log.articles_new = new_count
        log.status = "success"
        db.commit()

        logger.info("Scraped %s: %d found, %d new, %d skipped", source.name, found, new_count, skipped)
        return {"found": found, "new": new_count, "error": None}

    except Exception as e:
        db.rollback()
        logger.error("Scrape failed for %s: %s", source.name, e)
        log.finished_at = datetime.now(timezone.utc)
        log.status = "failed"
        log.error = str(e)
        db.commit()
        return {"found": 0, "new": 0, "error": str(e)}


def scrape_all_sources(db: Session) -> list[dict]:
    sources = db.query(Source).filter(Source.is_active == True).all()
    results = []
    for source in sources:
        result = scrape_source(source, db)
        results.append({"source": source.name, **result})
    return results
