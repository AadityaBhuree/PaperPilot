"""PaperPilot FastAPI application entry point."""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from backend.config import settings
from backend.database.connection import init_db
from backend.api.auth import router as auth_router
from backend.api.documents import router as documents_router
from backend.api.exams import router as exams_router
from backend.api.evaluation import router as evaluation_router
from backend.middleware.rate_limiter import limiter
from backend.middleware.request_logger import RequestLoggingMiddleware

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Initialise database tables on startup."""
    logger.info("Starting %s v%s", settings.APP_NAME, settings.APP_VERSION)
    await init_db()
    logger.info("Database tables ready")
    yield
    logger.info("Shutting down %s", settings.APP_NAME)


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# Structured request/response logging & tracing
app.add_middleware(RequestLoggingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting (applied globally)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]
app.add_middleware(SlowAPIMiddleware)

app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(exams_router)
app.include_router(evaluation_router)


from pathlib import Path
import os
from fastapi import Response, status
from sqlalchemy import text
from backend.database.connection import engine


@app.get("/", tags=["health"])
@app.get("/health", tags=["health"])
async def health_check() -> dict[str, object]:
    """Comprehensive health and diagnostic check."""
    db_ok = False
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            db_ok = True
    except Exception as exc:
        logger.warning("Database health check failed: %s", exc)

    upload_dir = Path(settings.UPLOAD_DIR)
    storage_ready = upload_dir.exists() or os.access(upload_dir.parent, os.W_OK)

    is_healthy = db_ok

    return {
        "status": "healthy" if is_healthy else "degraded",
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": "development" if settings.DEBUG else "production",
        "components": {
            "database": "connected" if db_ok else "unreachable",
            "ai_service": "configured" if bool(settings.GEMINI_API_KEY) else "not_configured",
            "storage": "ready" if storage_ready else "degraded",
        },
    }


@app.get("/health/live", tags=["health"])
async def liveness_probe() -> dict[str, str]:
    """Liveness probe: returns 200 if the app process is up."""
    return {"status": "alive"}


@app.get("/health/ready", tags=["health"])
async def readiness_probe(response: Response) -> dict[str, str]:
    """Readiness probe: returns 200 if the app can accept traffic, 503 otherwise."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "not_ready"}
