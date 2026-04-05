"""FastAPI application entry point."""
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import articles, sources, admin
from app.routers import briefings, rss, subscribe

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AI Intelligence Hub backend starting (env=%s)", settings.environment)
    # Auto-create any new tables (safe — won't touch existing ones)
    from app.database import Base, engine
    from app.models import briefing as _briefing_model      # noqa: F401
    from app.models import subscriber as _subscriber_model  # noqa: F401
    Base.metadata.create_all(bind=engine)
    yield
    logger.info("Backend shutting down")


app = FastAPI(
    title="AI Intelligence Hub API",
    description="Verified AI news aggregation and processing",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend origin
origins = [settings.frontend_url, "http://localhost:3000", "http://127.0.0.1:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(articles.router, prefix="/api/v1")
app.include_router(sources.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(briefings.router, prefix="/api/v1")
app.include_router(rss.router)
app.include_router(subscribe.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}
