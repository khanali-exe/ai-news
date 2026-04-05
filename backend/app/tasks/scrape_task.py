"""Celery task: scrape all active RSS sources."""
import logging

from app.tasks.celery_app import celery_app
from app.database import SessionLocal
from app.services.scraper import scrape_all_sources
from app.tasks.process_task import process_article_task

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.scrape_task.scrape_all_sources_task", bind=True, max_retries=2)
def scrape_all_sources_task(self):
    """Fetch new articles from all active RSS sources, then queue processing."""
    logger.info("Starting scheduled scrape of all sources")
    db = SessionLocal()
    try:
        results = scrape_all_sources(db)
        total_new = sum(r.get("new", 0) for r in results)
        logger.info("Scrape complete: %d new articles across %d sources", total_new, len(results))

        # Queue processing for each new article
        if total_new > 0:
            from app.models.article import Article
            pending = (
                db.query(Article)
                .filter(Article.processing_status == "pending")
                .all()
            )
            for article in pending:
                process_article_task.delay(article.id)
                logger.debug("Queued processing for article %d: %s", article.id, article.title[:60])

        return {"sources_scraped": len(results), "new_articles": total_new}

    except Exception as e:
        logger.error("Scrape task failed: %s", e)
        raise self.retry(exc=e, countdown=60)
    finally:
        db.close()
