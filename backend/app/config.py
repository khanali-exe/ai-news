from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    environment: str = "development"
    secret_key: str = "dev_secret"

    # Database
    database_url: str = "postgresql://ainews:ainews_secret@localhost:5432/ainews"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # OpenAI
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    ai_model: str = "gpt-4o-mini"

    # Cache TTLs (seconds)
    cache_ttl_article: int = 86400       # 24 hours
    cache_ttl_article_list: int = 300    # 5 minutes

    # Processing
    ai_max_retries: int = 3
    ai_timeout: int = 30
    scrape_interval_minutes: int = 30

    # Frontend (for ISR revalidation)
    frontend_url: str = "http://localhost:3000"
    revalidate_token: str = "dev_revalidate_token"

    # Email (Resend)
    resend_api_key: str = ""
    email_from: str = "AI Intelligence Hub <digest@ainews.example.com>"
    email_site_url: str = "http://localhost:3000"


@lru_cache
def get_settings() -> Settings:
    return Settings()
