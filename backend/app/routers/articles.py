import math
import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from app.database import get_db
from app.models.article import Article
from app.models.source import Source
from app.schemas.article import ArticleDetail, ArticleList, PaginatedArticles
from app.services.cache import cache_get, cache_set
from app.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/articles", tags=["articles"])
settings = get_settings()


def _article_to_dict(article: Article, full: bool = False) -> dict:
    source = getattr(article, "source", None)
    src = {
        "id": source.id,
        "name": source.name,
        "domain": source.domain,
        "trust_tier": source.trust_tier,
    } if source else None

    base = {
        "id": article.id,
        "title": article.title,
        "slug": article.slug,
        "url": article.url,
        "tl_dr": article.tl_dr,
        "category": article.category,
        "verification_status": article.verification_status,
        "published_at": article.published_at,
        "image_url": article.image_url,
        "source": src,
    }
    if full:
        base.update({
            "what_happened": article.what_happened,
            "why_it_matters": article.why_it_matters,
            "potential_use_case": article.potential_use_case,
            "fact_check_valid": article.fact_check_valid,
            "fact_check_reason": article.fact_check_reason,
            "processed_at": article.processed_at,
        })
    return base


@router.get("", response_model=PaginatedArticles)
def list_articles(
    category: Optional[str] = Query(None),
    verification_status: Optional[str] = Query(None),
    source_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    max_id: Optional[int] = Query(None),   # cursor — freeze result set after page 1
    db: Session = Depends(get_db),
):
    cache_key = (
        f"article_list:{page}:{page_size}:{category}:{verification_status}:{source_id}:{max_id}"
        if not search else None
    )
    if cache_key:
        cached = cache_get(cache_key)
        if cached:
            return cached

    query = (
        db.query(Article)
        .options(joinedload(Article.source))
        .filter(Article.is_published == True, Article.verification_status == "verified")
    )

    if category:
        query = query.filter(Article.category == category)
    if verification_status:
        query = query.filter(Article.verification_status == verification_status)
    if source_id:
        query = query.filter(Article.source_id == source_id)
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(Article.title.ilike(term), Article.tl_dr.ilike(term))
        )
    # Cursor: only articles published at or before the snapshot taken on page 1
    if max_id is not None:
        query = query.filter(Article.id <= max_id)

    total = query.count()
    articles = (
        query.order_by(Article.published_at.desc().nullslast(), Article.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    result = {
        "items": [_article_to_dict(a) for a in articles],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, math.ceil(total / page_size)),
    }

    if cache_key:
        cache_set(cache_key, result, settings.cache_ttl_article_list)
    return result


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    from sqlalchemy import func
    rows = (
        db.query(Article.category, func.count(Article.id).label("count"))
        .filter(Article.is_published == True, Article.category.isnot(None))
        .group_by(Article.category)
        .all()
    )
    return [{"category": r.category, "count": r.count} for r in rows]


@router.get("/stats")
def public_stats(db: Session = Depends(get_db)):
    from sqlalchemy import func
    total = db.query(func.count(Article.id)).filter(
        Article.is_published == True, Article.verification_status == "verified"
    ).scalar()
    by_cat = (
        db.query(Article.category, func.count(Article.id))
        .filter(Article.is_published == True, Article.verification_status == "verified", Article.category.isnot(None))
        .group_by(Article.category)
        .all()
    )
    return {"total_published": total, "by_category": {c: n for c, n in by_cat if c}}


@router.get("/trending")
def get_trending(db: Session = Depends(get_db)):
    """Return articles published today (UTC). Empty list if none."""
    cache_key = "trending:today"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    since = datetime.utcnow() - timedelta(hours=24)
    articles = (
        db.query(Article)
        .options(joinedload(Article.source))
        .filter(
            Article.is_published == True,
            Article.verification_status == "verified",
            Article.published_at >= since,
        )
        .order_by(Article.published_at.desc())
        .all()
    )

    result = [_article_to_dict(a) for a in articles]
    cache_set(cache_key, result, 600)   # 10-min cache
    return result


@router.get("/{slug}", response_model=ArticleDetail)
def get_article(slug: str, db: Session = Depends(get_db)):
    cache_key = f"article_slug:{slug}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    article = (
        db.query(Article)
        .options(joinedload(Article.source))
        .filter(Article.slug == slug, Article.is_published == True)
        .first()
    )
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    result = _article_to_dict(article, full=True)
    cache_set(cache_key, result, settings.cache_ttl_article)
    return result


@router.post("/{slug}/explain")
def explain_article(slug: str, db: Session = Depends(get_db)):
    """
    Generate a simple plain-language explanation of the article.
    Cached per article — only calls the AI once.
    """
    cache_key = f"explain:{slug}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    article = (
        db.query(Article)
        .filter(Article.slug == slug, Article.is_published == True)
        .first()
    )
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    if not article.raw_content:
        raise HTTPException(status_code=422, detail="No source content available")

    from openai import OpenAI
    import json as _json

    client = OpenAI(
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
        timeout=20,
    )

    prompt = f"""Explain this AI news article in very simple terms, like you're explaining to someone with no technical background. Be friendly and clear, max 3 sentences.

Title: {article.title}
Summary: {article.tl_dr or ''}
Details: {(article.what_happened or '')[:1000]}

Return JSON: {{"explanation": "your simple explanation here"}}"""

    try:
        resp = client.chat.completions.create(
            model=settings.ai_model,
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=200,
        )
        data = _json.loads(resp.choices[0].message.content)
        result = {"explanation": data.get("explanation", "")}
        cache_set(cache_key, result, 604800)  # cache 7 days
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {e}")
