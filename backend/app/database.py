from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import NullPool
from app.config import get_settings

settings = get_settings()

# Serverless (Vercel) needs NullPool — each request opens/closes its own connection.
# Neon's PgBouncer handles pooling at the infrastructure level.
# For local/VPS with a persistent process, the regular pool is fine but NullPool works too.
engine = create_engine(
    settings.database_url,
    poolclass=NullPool,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
