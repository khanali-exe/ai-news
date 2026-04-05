from sqlalchemy import Column, ForeignKey, Integer, String, Text, DateTime, func
from app.database import Base


class ScrapeLog(Base):
    __tablename__ = "scrape_logs"

    id = Column(Integer, primary_key=True)
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    finished_at = Column(DateTime(timezone=True))
    articles_found = Column(Integer)
    articles_new = Column(Integer)
    status = Column(String(20), nullable=False, default="running")
    error = Column(Text)
