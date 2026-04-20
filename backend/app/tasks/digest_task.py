"""Daily email digest — fetches subscribed users from Clerk, sends if articles published today."""
import logging
from datetime import datetime, timezone

import httpx

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


def _get_subscribed_users(clerk_secret_key: str) -> list[dict]:
    """Return list of {email, first_name} for all Clerk users with unsafeMetadata.subscribed=true."""
    users = []
    offset = 0
    limit = 500

    with httpx.Client(timeout=30) as client:
        while True:
            resp = client.get(
                "https://api.clerk.com/v1/users",
                headers={"Authorization": f"Bearer {clerk_secret_key}"},
                params={"limit": limit, "offset": offset},
            )
            resp.raise_for_status()
            batch = resp.json()
            if not batch:
                break

            for u in batch:
                if u.get("unsafe_metadata", {}).get("subscribed") is True:
                    primary = next(
                        (e["email_address"] for e in u.get("email_addresses", [])
                         if e["id"] == u.get("primary_email_address_id")),
                        None,
                    )
                    if primary:
                        users.append({
                            "email": primary,
                            "first_name": u.get("first_name") or "",
                        })

            if len(batch) < limit:
                break
            offset += limit

    return users


@celery_app.task(name="app.tasks.digest_task.send_daily_digest_task")
def send_daily_digest_task():
    from app.config import get_settings
    from app.database import SessionLocal
    from app.models.article import Article
    from app.services.email_sender import send_email, digest_email_html
    from app.routers.articles import _article_to_dict

    settings = get_settings()

    if not settings.clerk_secret_key:
        logger.warning("CLERK_SECRET_KEY not set — cannot fetch subscribers, skipping digest")
        return

    if not settings.resend_api_key or settings.resend_api_key.startswith("re_your"):
        logger.warning("RESEND_API_KEY not configured — skipping digest")
        return

    db = SessionLocal()
    try:
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        articles = (
            db.query(Article)
            .filter(
                Article.is_published == True,
                Article.verification_status.in_(["verified", "confirmed"]),
                Article.published_at >= today_start,
            )
            .order_by(Article.published_at.desc())
            .all()
        )

        if not articles:
            logger.info("No articles published today — skipping digest")
            return

        subscribers = _get_subscribed_users(settings.clerk_secret_key)
        if not subscribers:
            logger.info("No subscribed users — skipping digest")
            return

        date_label = datetime.now(timezone.utc).strftime("%B %d, %Y")
        article_dicts = [_article_to_dict(a) for a in articles]
        subject = f"AI Digest — {len(articles)} new article{'s' if len(articles) != 1 else ''} today ({date_label})"

        sent = 0
        for sub in subscribers:
            unsub_url = f"{settings.email_site_url}/?unsubscribe=1"
            html = digest_email_html(date_label, article_dicts, settings.email_site_url, unsub_url)
            if send_email(to=sub["email"], subject=subject, html=html):
                sent += 1

        logger.info("Daily digest sent to %d/%d subscribers (%d articles)", sent, len(subscribers), len(articles))

    except Exception as e:
        logger.error("Digest task failed: %s", e)
        db.rollback()
    finally:
        db.close()
