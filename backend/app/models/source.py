from sqlalchemy import Boolean, Column, Integer, String, Text, DateTime, func
from app.database import Base


class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    rss_url = Column(Text, nullable=False, unique=True)
    domain = Column(String(255), nullable=False)
    trust_tier = Column(String(20), nullable=False, default="secondary")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
