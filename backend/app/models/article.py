from sqlalchemy import (
    Boolean, Column, ForeignKey, Integer, String, Text, DateTime, func
)
from sqlalchemy.orm import relationship
from app.database import Base


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True)
    title = Column(Text, nullable=False)
    slug = Column(String(300), nullable=False, unique=True)
    url = Column(Text, nullable=False, unique=True)
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=False)
    raw_content = Column(Text)
    published_at = Column(DateTime(timezone=True))
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())

    # AI fields
    tl_dr = Column(String(200))
    what_happened = Column(Text)
    why_it_matters = Column(Text)
    potential_use_case = Column(Text)
    category = Column(String(50))

    # Verification
    verification_status = Column(String(20), nullable=False, default="unverified")
    fact_check_valid = Column(Boolean)
    fact_check_reason = Column(Text)

    # Processing state
    processing_status = Column(String(20), nullable=False, default="pending")
    processing_error = Column(Text)
    processed_at = Column(DateTime(timezone=True))

    # Image
    image_url = Column(Text)

    # Display flag
    is_published = Column(Boolean, nullable=False, default=False)

    # Relationship
    source = relationship("Source", lazy="select")
