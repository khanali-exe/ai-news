"""RSS 2.0 feed — verified AI articles."""
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.article import Article
from app.services.cache import get_redis

logger = logging.getLogger(__name__)
router = APIRouter(tags=["rss"])

SITE_URL = "https://ainews.example.com"   # update with real domain when deployed
API_URL  = "http://localhost:8000"


def _esc(s: str | None) -> str:
    if not s:
        return ""
    return (
        s.replace("&", "&amp;")
         .replace("<", "&lt;")
         .replace(">", "&gt;")
         .replace('"', "&quot;")
         .replace("'", "&apos;")
    )


def _pub_date(dt: datetime | None) -> str:
    if not dt:
        return ""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.strftime("%a, %d %b %Y %H:%M:%S %z")


def _item(a: Article) -> str:
    source_label = _esc(a.source.name) if a.source else ""
    description = _esc(a.tl_dr or "")
    if a.what_happened:
        description += f" {_esc(a.what_happened)}"

    return f"""
    <item>
      <title>{_esc(a.title)}</title>
      <link>{_esc(a.url)}</link>
      <guid isPermaLink="false">{_esc(a.slug)}</guid>
      <description>{description.strip()}</description>
      <pubDate>{_pub_date(a.published_at)}</pubDate>
      <category>{_esc(a.category or "")}</category>
      <author>{source_label}</author>
      <source url="{_esc(a.url)}">{source_label}</source>
    </item>"""


@router.get("/api/rss", include_in_schema=True, summary="RSS 2.0 feed of verified articles")
def rss_feed(db: Session = Depends(get_db)):
    """Subscribe to get verified AI news in any RSS reader."""
    redis = get_redis()
    cached = redis.get("rss:feed")
    if cached:
        return Response(content=cached, media_type="application/rss+xml; charset=utf-8")

    articles = (
        db.query(Article)
        .options(joinedload(Article.source))
        .filter(Article.is_published == True)
        .order_by(Article.published_at.desc().nullslast())
        .limit(50)
        .all()
    )

    now_rfc = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S %z")
    items_xml = "".join(_item(a) for a in articles)

    feed = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>AI Intelligence Hub — Verified AI News</title>
    <link>{SITE_URL}</link>
    <description>Verified, fact-checked AI news automatically curated from primary sources: OpenAI, DeepMind, Anthropic, Meta AI, Hugging Face, and more.</description>
    <language>en-us</language>
    <lastBuildDate>{now_rfc}</lastBuildDate>
    <ttl>30</ttl>
    <atom:link href="{API_URL}/api/rss" rel="self" type="application/rss+xml"/>
    <managingEditor>noreply@ainews.example.com (AI Intelligence Hub)</managingEditor>
    <image>
      <url>{SITE_URL}/icon.png</url>
      <title>AI Intelligence Hub</title>
      <link>{SITE_URL}</link>
    </image>
{items_xml}
  </channel>
</rss>"""

    redis.setex("rss:feed", 300, feed)   # 5-min cache
    return Response(content=feed, media_type="application/rss+xml; charset=utf-8")
