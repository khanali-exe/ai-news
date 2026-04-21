"""Post new articles to X (Twitter) automatically."""
import logging
import tweepy
from app.config import get_settings

logger = logging.getLogger(__name__)

CAT_HASHTAGS: dict[str, str] = {
    "models":   "#AI #LLM #MachineLearning",
    "research": "#AIResearch #MachineLearning #DeepLearning",
    "tools":    "#AI #DevTools #AITools",
    "business": "#AI #Tech #Startups",
    "policy":   "#AIPolicy #TechPolicy #AI",
    "other":    "#AI #Tech",
}


def get_client() -> tweepy.Client | None:
    s = get_settings()
    if not all([s.x_api_key, s.x_api_secret, s.x_access_token, s.x_access_token_secret]):
        logger.warning("X API credentials not configured")
        return None
    return tweepy.Client(
        consumer_key=s.x_api_key,
        consumer_secret=s.x_api_secret,
        access_token=s.x_access_token,
        access_token_secret=s.x_access_token_secret,
    )


def post_article(article_dict: dict) -> bool:
    client = get_client()
    if not client:
        return False

    title    = article_dict.get("title") or ""
    tl_dr    = article_dict.get("tl_dr") or ""
    slug     = article_dict.get("slug") or ""
    category = article_dict.get("category") or "other"
    hashtags = CAT_HASHTAGS.get(category, CAT_HASHTAGS["other"])
    site_url = get_settings().email_site_url

    url = f"{site_url}/article/{slug}"

    # Build tweet — keep under 280 chars
    # Title (max 120) + tl_dr (max 100) + url + hashtags
    title_part = title[:117] + "…" if len(title) > 120 else title
    tl_dr_part = tl_dr[:97]  + "…" if len(tl_dr) > 100 else tl_dr

    tweet = f"🤖 {title_part}\n\n{tl_dr_part}\n\n{url}\n\n{hashtags}"

    # Trim if still over 280
    if len(tweet) > 280:
        tweet = f"🤖 {title_part}\n\n{url}\n\n{hashtags}"

    try:
        client.create_tweet(text=tweet)
        logger.info("Posted to X: %s", title[:60])
        return True
    except tweepy.TweepyException as e:
        logger.error("Failed to post to X: %s", e)
        return False
