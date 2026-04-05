from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class SourceInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    domain: str
    trust_tier: str


class ArticleList(BaseModel):
    """Lightweight representation for the news feed."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    slug: str
    url: str
    tl_dr: Optional[str]
    category: Optional[str]
    verification_status: str
    published_at: Optional[datetime]
    image_url: Optional[str] = None
    source: Optional[SourceInfo] = None


class ArticleDetail(BaseModel):
    """Full article with all AI analysis fields."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    slug: str
    url: str
    tl_dr: Optional[str]
    what_happened: Optional[str]
    why_it_matters: Optional[str]
    potential_use_case: Optional[str]
    category: Optional[str]
    verification_status: str
    fact_check_valid: Optional[bool]
    fact_check_reason: Optional[str]
    published_at: Optional[datetime]
    processed_at: Optional[datetime]
    image_url: Optional[str] = None
    source: Optional[SourceInfo] = None


class ArticleFilterParams(BaseModel):
    category: Optional[str] = None
    verification_status: Optional[str] = None
    source_id: Optional[int] = None
    page: int = 1
    page_size: int = 20


class PaginatedArticles(BaseModel):
    items: list[ArticleList]
    total: int
    page: int
    page_size: int
    total_pages: int
