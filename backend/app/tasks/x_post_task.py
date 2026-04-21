"""Post newly published articles to X automatically."""
import logging
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)

# Track daily post count to stay within free tier (1500/month ≈ 50/day)
DAILY_LIMIT = 10


@celery_app.task(name="app.tasks.x_post_task.post_article_to_x")
def post_article_to_x(article_id: int):
    from app.config import get_settings
    from app.database import SessionLocal
    from app.models.article import Article
    from app.services.x_poster import post_article
    from app.routers.articles import _article_to_dict
    from datetime import datetime, timezone

    settings = get_settings()
    if not settings.x_api_key:
        return

    db = SessionLocal()
    try:
        article = db.query(Article).filter(Article.id == article_id).first()
        if not article or not article.is_published:
            return

        # Check daily post count
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        posted_today = (
            db.query(Article)
            .filter(
                Article.x_posted == True,
                Article.x_posted_at >= today_start,
            )
            .count()
        )
        if posted_today >= DAILY_LIMIT:
            logger.info("Daily X post limit (%d) reached, skipping article %d", DAILY_LIMIT, article_id)
            return

        article_dict = _article_to_dict(article)
        success = post_article(article_dict)

        if success:
            article.x_posted = True
            article.x_posted_at = datetime.now(timezone.utc)
            db.commit()
            logger.info("Article %d posted to X", article_id)

    except Exception as e:
        logger.error("X post task failed for article %d: %s", article_id, e)
        db.rollback()
    finally:
        db.close()
