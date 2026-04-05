import json
import logging
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.briefing import Briefing
from app.models.article import Article
from app.services.cache import cache_get, cache_set
from app.routers.articles import _article_to_dict

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/briefings", tags=["briefings"])


def _to_response(b: Briefing, db: Session) -> dict:
    slugs = json.loads(b.article_slugs or "[]")
    articles = []
    for slug in slugs:
        a = (
            db.query(Article)
            .options(joinedload(Article.source))
            .filter(Article.slug == slug)
            .first()
        )
        if a:
            articles.append(_article_to_dict(a))
    return {
        "date": b.date.isoformat(),
        "headline": b.headline,
        "summary": b.summary,
        "articles": articles,
        "created_at": b.created_at.isoformat() if b.created_at else None,
    }


@router.get("/latest")
def get_latest_briefing(db: Session = Depends(get_db)):
    b = db.query(Briefing).order_by(Briefing.date.desc()).first()
    if not b:
        raise HTTPException(status_code=404, detail="No briefings generated yet")
    cache_key = f"briefing:{b.date.isoformat()}"
    cached = cache_get(cache_key)
    if cached:
        return cached
    result = _to_response(b, db)
    cache_set(cache_key, result, 3600)
    return result


@router.get("/{date_str}")
def get_briefing(date_str: str, db: Session = Depends(get_db)):
    try:
        d = date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Use YYYY-MM-DD format")

    cache_key = f"briefing:{date_str}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    b = db.query(Briefing).filter(Briefing.date == d).first()
    if not b:
        raise HTTPException(status_code=404, detail="No briefing for this date")

    result = _to_response(b, db)
    cache_set(cache_key, result, 3600)
    return result
