from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from app.database import Base


class Subscriber(Base):
    __tablename__ = "subscribers"

    id         = Column(Integer, primary_key=True)
    email      = Column(String(255), nullable=False, unique=True)
    token      = Column(String(64), nullable=False, unique=True)   # confirm + unsubscribe token
    confirmed  = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
