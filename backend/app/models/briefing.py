from sqlalchemy import Column, Integer, Text, Date, DateTime, func
from app.database import Base


class Briefing(Base):
    __tablename__ = "briefings"

    id = Column(Integer, primary_key=True)
    date = Column(Date, nullable=False, unique=True)
    headline = Column(Text)
    summary = Column(Text)
    article_slugs = Column(Text)   # JSON array of slugs
    created_at = Column(DateTime(timezone=True), server_default=func.now())
