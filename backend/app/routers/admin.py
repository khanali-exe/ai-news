"""Admin endpoints — trigger scrapes, view stats, manage processing queue."""
import logging
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.config import get_settings
from app.models.article import Article
from app.models.scrape_log import ScrapeLog

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])
settings = get_settings()


def _check_secret(x_secret: str = Header(...)):
    if x_secret != settings.secret_key:
        raise HTTPException(status_code=403, detail="Forbidden")


@router.post("/scrape/trigger")
def trigger_scrape(_=Depends(_check_secret)):
    """Manually trigger a full scrape cycle."""
    from app.tasks.scrape_task import scrape_all_sources_task
    task = scrape_all_sources_task.delay()
    return {"status": "queued", "task_id": task.id}


@router.post("/process/trigger")
def trigger_process(_=Depends(_check_secret)):
    """Manually queue all pending articles for processing."""
    from app.tasks.process_task import process_pending_articles_task
    task = process_pending_articles_task.delay()
    return {"status": "queued", "task_id": task.id}


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _=Depends(_check_secret)):
    total = db.query(func.count(Article.id)).scalar()
    published = db.query(func.count(Article.id)).filter(Article.is_published == True).scalar()
    pending = db.query(func.count(Article.id)).filter(Article.processing_status == "pending").scalar()
    failed = db.query(func.count(Article.id)).filter(Article.processing_status == "failed").scalar()
    rejected = db.query(func.count(Article.id)).filter(Article.processing_status == "rejected").scalar()

    by_category = (
        db.query(Article.category, func.count(Article.id))
        .filter(Article.is_published == True)
        .group_by(Article.category)
        .all()
    )

    return {
        "total_articles": total,
        "published": published,
        "pending": pending,
        "failed": failed,
        "rejected": rejected,
        "by_category": {cat: count for cat, count in by_category if cat},
    }


@router.get("/scrape/logs")
def get_scrape_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    _=Depends(_check_secret),
):
    logs = (
        db.query(ScrapeLog)
        .order_by(ScrapeLog.started_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": l.id,
            "source_id": l.source_id,
            "started_at": l.started_at,
            "finished_at": l.finished_at,
            "articles_found": l.articles_found,
            "articles_new": l.articles_new,
            "status": l.status,
            "error": l.error,
        }
        for l in logs
    ]
