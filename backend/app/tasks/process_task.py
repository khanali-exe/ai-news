"""Celery task: AI processing pipeline for a single article."""
import logging
from datetime import datetime, timezone

from app.tasks.celery_app import celery_app
from app.database import SessionLocal
from app.models.article import Article
from app.services.ai_processor import process_article
from app.services.fact_checker import fact_check_article
from app.services.verification import assign_verification_status
from app.services.cache import invalidate_article

logger = logging.getLogger(__name__)


@celery_app.task(
    name="app.tasks.process_task.process_article_task",
    bind=True,
    max_retries=3,
    default_retry_delay=30,
)
def process_article_task(self, article_id: int):
    """
    Full processing pipeline for one article:
    1. AI generate structured analysis
    2. Fact-check the analysis
    3. Assign verification status
    4. Publish if valid
    """
    db = SessionLocal()
    try:
        article = db.query(Article).filter(Article.id == article_id).first()
        if not article:
            logger.warning("Article %d not found", article_id)
            return

        if article.processing_status in ("done", "rejected"):
            logger.debug("Article %d already processed (%s), skipping", article_id, article.processing_status)
            return

        # Mark as processing
        article.processing_status = "processing"
        db.commit()

        # ── Step 1: AI analysis ───────────────────────────────────────────────
        analysis = process_article(
            article_id=article.id,
            title=article.title,
            url=article.url,
            raw_content=article.raw_content,
        )

        if not analysis:
            article.processing_status = "failed"
            article.processing_error = "AI processing returned no output"
            db.commit()
            logger.warning("AI processing returned nothing for article %d", article_id)
            return

        # ── Step 1b: AI relevance gate ────────────────────────────────────────
        if not analysis.get("is_ai_relevant", True):
            article.processing_status = "rejected"
            article.processing_error = "Not AI-related content"
            article.is_published = False
            db.commit()
            logger.info("Article %d rejected: not AI-related", article_id)
            return

        # ── Step 2: Fact-check ────────────────────────────────────────────────
        fc_result = fact_check_article(
            title=article.title,
            raw_content=article.raw_content or "",
            analysis=analysis,
        )

        article.fact_check_valid = fc_result["is_valid"]
        article.fact_check_reason = fc_result["reason"]

        if not fc_result["is_valid"]:
            article.processing_status = "rejected"
            article.processing_error = f"Fact-check failed: {fc_result['reason']}"
            db.commit()
            logger.info("Article %d rejected by fact-checker: %s", article_id, fc_result["reason"])
            return

        # ── Step 3: Write AI fields ───────────────────────────────────────────
        article.tl_dr = analysis.get("tl_dr")
        article.what_happened = analysis.get("what_happened")
        article.why_it_matters = analysis.get("why_it_matters")
        article.potential_use_case = analysis.get("potential_use_case")
        article.category = analysis.get("category")

        # ── Step 4: Verification status ───────────────────────────────────────
        verification = assign_verification_status(article, db)
        article.verification_status = verification

        # Only publish verified or confirmed articles
        article.is_published = verification in ("verified", "confirmed")
        article.processing_status = "done"
        article.processed_at = datetime.now(timezone.utc)
        db.commit()

        # Invalidate cached versions of this article
        invalidate_article(article_id)

        logger.info(
            "Article %d processed: category=%s, verification=%s, published=%s",
            article_id, article.category, verification, article.is_published
        )

        return {
            "article_id": article_id,
            "category": article.category,
            "verification": verification,
            "published": article.is_published,
        }

    except Exception as e:
        db.rollback()
        logger.error("Processing failed for article %d: %s", article_id, e)
        try:
            article = db.query(Article).filter(Article.id == article_id).first()
            if article:
                article.processing_status = "failed"
                article.processing_error = str(e)
                db.commit()
        except Exception:
            pass
        raise self.retry(exc=e)
    finally:
        db.close()


@celery_app.task(name="app.tasks.process_task.process_pending_articles_task")
def process_pending_articles_task():
    """Catch-all: process any articles that are still pending (e.g. after restart)."""
    db = SessionLocal()
    try:
        pending = (
            db.query(Article)
            .filter(Article.processing_status == "pending")
            .limit(50)
            .all()
        )
        for article in pending:
            process_article_task.delay(article.id)
        logger.info("Queued %d pending articles for processing", len(pending))
        return {"queued": len(pending)}
    finally:
        db.close()
