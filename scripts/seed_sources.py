"""
Seed default RSS sources into the database.
Run once after initial migration:
  python scripts/seed_sources.py
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.app.database import SessionLocal
from backend.app.models.source import Source

SOURCES = [
    {"name": "OpenAI Blog",          "rss_url": "https://openai.com/blog/rss.xml",                                    "domain": "openai.com",           "trust_tier": "primary"},
    {"name": "Google DeepMind Blog", "rss_url": "https://deepmind.google/blog/rss.xml",                               "domain": "deepmind.google",      "trust_tier": "primary"},
    {"name": "Anthropic News",       "rss_url": "https://www.anthropic.com/news/rss.xml",                             "domain": "anthropic.com",        "trust_tier": "primary"},
    {"name": "Meta AI Blog",         "rss_url": "https://ai.meta.com/blog/rss.xml",                                   "domain": "ai.meta.com",          "trust_tier": "primary"},
    {"name": "Hugging Face Blog",    "rss_url": "https://huggingface.co/blog/feed.xml",                               "domain": "huggingface.co",       "trust_tier": "primary"},
    {"name": "The Verge AI",         "rss_url": "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml",  "domain": "theverge.com",         "trust_tier": "secondary"},
    {"name": "VentureBeat AI",       "rss_url": "https://venturebeat.com/category/ai/feed/",                          "domain": "venturebeat.com",      "trust_tier": "secondary"},
    {"name": "MIT Tech Review AI",   "rss_url": "https://www.technologyreview.com/feed/",                             "domain": "technologyreview.com", "trust_tier": "secondary"},
    {"name": "Ars Technica",         "rss_url": "https://feeds.arstechnica.com/arstechnica/technology-lab",           "domain": "arstechnica.com",      "trust_tier": "secondary"},
    {"name": "TechCrunch AI",        "rss_url": "https://techcrunch.com/category/artificial-intelligence/feed/",     "domain": "techcrunch.com",       "trust_tier": "secondary"},
]


def seed():
    db = SessionLocal()
    added = 0
    try:
        for s in SOURCES:
            exists = db.query(Source).filter(Source.rss_url == s["rss_url"]).first()
            if not exists:
                db.add(Source(**s))
                added += 1
        db.commit()
        print(f"Seeded {added} new sources ({len(SOURCES) - added} already existed)")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
