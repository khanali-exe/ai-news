"""Daily email digest — sends only if articles were published today."""
import logging
from datetime import datetime, timedelta, timezone

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.digest_task.send_daily_digest_task")
def send_daily_digest_task():
    from app.config import get_settings
    from app.database import SessionLocal
    from app.models.article import Article
    from app.models.subscriber import Subscriber
    from app.services.email_sender import send_email, digest_email_html
    from app.routers.articles import _article_to_dict

    settings = get_settings()
    db = SessionLocal()
    try:
        # Articles published today (UTC)
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        articles = (
            db.query(Article)
            .filter(
                Article.is_published == True,
                Article.verification_status == "verified",
                Article.published_at >= today_start,
            )
            .order_by(Article.published_at.desc())
            .all()
        )

        if not articles:
            logger.info("No articles published today — skipping digest")
            return

        subscribers = db.query(Subscriber).filter(Subscriber.confirmed == True).all()
        if not subscribers:
            logger.info("No confirmed subscribers — skipping digest")
            return

        date_label = datetime.now(timezone.utc).strftime("%B %d, %Y")
        article_dicts = [_article_to_dict(a) for a in articles]

        sent = 0
        for sub in subscribers:
            unsub_url = f"{settings.email_site_url}/subscribe/unsubscribe?token={sub.token}"
            html = digest_email_html(date_label, article_dicts, settings.email_site_url, unsub_url)
            subject = f"AI Digest — {len(articles)} new article{'s' if len(articles) != 1 else ''} today ({date_label})"
            ok = send_email(to=sub.email, subject=subject, html=html)
            if ok:
                sent += 1

        logger.info("Daily digest sent to %d/%d subscribers (%d articles)", sent, len(subscribers), len(articles))

    except Exception as e:
        logger.error("Digest task failed: %s", e)
        db.rollback()
    finally:
        db.close()
