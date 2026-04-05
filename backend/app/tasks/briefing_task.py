import json
import logging
from datetime import datetime, timedelta, date

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.briefing_task.generate_daily_briefing_task")
def generate_daily_briefing_task():
    from app.config import get_settings
    from app.database import SessionLocal
    from app.models.article import Article
    from app.models.briefing import Briefing
    from app.services.cache import cache_set
    from openai import OpenAI

    settings = get_settings()
    db = SessionLocal()
    try:
        today = date.today()

        # Skip if already generated today
        if db.query(Briefing).filter(Briefing.date == today).first():
            logger.info("Briefing for %s already exists, skipping", today)
            return

        # Fetch top articles from last 24h (fallback to 48h if sparse)
        for hours in (24, 48):
            cutoff = datetime.utcnow() - timedelta(hours=hours)
            articles = (
                db.query(Article)
                .filter(Article.is_published == True, Article.published_at >= cutoff)
                .order_by(Article.published_at.desc())
                .limit(10)
                .all()
            )
            if len(articles) >= 3:
                break

        if not articles:
            logger.warning("Not enough articles to generate briefing for %s", today)
            return

        top5 = articles[:5]
        stories = "\n".join(
            f"{i}. {a.title}: {a.tl_dr or a.what_happened or ''}"
            for i, a in enumerate(top5, 1)
        )

        prompt = f"""You are an AI news editor writing the daily briefing for {today.strftime('%B %d, %Y')}.

Today's top AI stories:
{stories}

Write:
1. A punchy, specific headline (reference the actual news, not generic "AI Today")
2. A flowing narrative paragraph (150-200 words) connecting the stories with context and insight

Return JSON: {{"headline": "...", "summary": "..."}}"""

        client = OpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
            timeout=30,
        )
        resp = client.chat.completions.create(
            model=settings.ai_model,
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=500,
        )
        data = json.loads(resp.choices[0].message.content)

        briefing = Briefing(
            date=today,
            headline=data.get("headline", f"AI Briefing — {today}"),
            summary=data.get("summary", ""),
            article_slugs=json.dumps([a.slug for a in top5]),
        )
        db.add(briefing)
        db.commit()
        logger.info("Generated daily briefing for %s: %s", today, briefing.headline)

    except Exception as e:
        logger.error("Failed to generate briefing: %s", e)
        db.rollback()
    finally:
        db.close()
