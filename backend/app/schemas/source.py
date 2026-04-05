from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class SourceCreate(BaseModel):
    name: str
    rss_url: str
    domain: str
    trust_tier: str = "secondary"


class SourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    rss_url: str
    domain: str
    trust_tier: str
    is_active: bool
    created_at: Optional[datetime]
