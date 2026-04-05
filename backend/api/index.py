"""Vercel serverless entry point — wraps the FastAPI app with Mangum."""
import sys
import os

# Ensure the backend root is on the path so `app.*` imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from mangum import Mangum  # noqa: E402
from app.main import app   # noqa: E402

handler = Mangum(app, lifespan="auto")
