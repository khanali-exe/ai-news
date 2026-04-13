"""RSS scraper — fetches articles from configured sources."""
import hashlib
import logging
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

FETCH_TIMEOUT = 15  # seconds
MAX_CONTENT_CHARS = 8000  # cap raw content to avoid huge DB rows


def _fetch_page(url: str) -> Optional[BeautifulSoup]:
    """Fetch a page and return its BeautifulSoup, or None on failure."""
    try:
        resp = httpx.get(url, timeout=FETCH_TIMEOUT, follow_redirects=True,
                         headers={"User-Agent": "Mozilla/5.0 (compatible; AINewsBot/1.0)"})
        resp.raise_for_status()
        return BeautifulSoup(resp.text, "lxml")
    except Exception as e:
        logger.debug("Could not fetch page %s: %s", url, e)
        return None


def _extract_og_image(soup: BeautifulSoup) -> Optional[str]:
    """Extract og:image or twitter:image from a parsed page."""
    for attr, name in [("property", "og:image"), ("name", "twitter:image")]:
        tag = soup.find("meta", attrs={attr: name})
        if tag and tag.get("content", "").startswith("http"):
            return tag["content"]
    return None


def _fetch_full_text(url: str) -> tuple[Optional[str], Optional[str]]:
    """Fetch article page, return (text_content, image_url)."""
    soup = _fetch_page(url)
    if not soup:
        return None, None

    image_url = _extract_og_image(soup)

    # Remove nav, ads, footers
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
    """
    Fetch RSS feed for a single source.
    Returns {"found": int, "new": int, "error": str|None}.
    """
    log = ScrapeLog(source_id=source.id)
    db.add(log)
    db.commit()
    db.refresh(log)

    try:
        feed = feedparser.parse(source.rss_url)
        if feed.bozo and not feed.entries:
            raise ValueError(f"Malformed feed: {feed.bozo_exception}")

        found = len(feed.entries)
        new_count = 0

        for entry in feed.entries:
            url = entry.get("link", "").strip()
            title = entry.get("title", "").strip()

            if not url or not title:
                continue

            # Pre-filter: skip tutorial/guide/documentation titles
            _title_lower = title.lower()
            _skip_prefixes = (
                "how to ", "using ", "working with ", "getting started",
                "introduction to ", "guide to ", "learn to ", "tutorial:",
                "prompting ", "personalizing ", "creating images with",
            )
            _skip_keywords = (
                " tutorial", " walkthrough", " cheat sheet", "step-by-step",
                "for beginners", "tips and tricks",
            )
            if any(_title_lower.startswith(p) for p in _skip_prefixes) or \
               any(k in _title_lower for k in _skip_keywords):
                logger.debug("Skipping tutorial-style article: %s", title)
                continue

            # Skip if already in DB (check both url and slug)
            slug = _make_slug(title, url)
            exists = db.query(Article.id).filter(
                (Article.url == url) | (Article.slug == slug)
            ).first()
            if exists:
                continue

            # Try to get image from RSS media tags first
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

            # Get content — prefer feed summary, fall back to full page fetch
            raw_content = (
                entry.get("summary", "")
                or entry.get("content", [{}])[0].get("value", "")
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
                db.flush()  # catch constraint violations per-article
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

        logger.info("Scraped %s: %d found, %d new", source.name, found, new_count)
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
    """Iterate all active sources and scrape each."""
    sources = db.query(Source).filter(Source.is_active == True).all()
    results = []
    for source in sources:
        result = scrape_source(source, db)
        results.append({"source": source.name, **result})
    return results
