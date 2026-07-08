"""Async database connection and session management."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from backend.config import settings


# ── Engine ──────────────────────────────────────────────────────────────────
# Use connection pooling for PostgreSQL, simple engine for SQLite.
_is_postgres = settings.DATABASE_URL.startswith("postgresql")

engine_kwargs: dict[str, object] = {
    "echo": settings.DEBUG,
}

if _is_postgres:
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10
    engine_kwargs["pool_pre_ping"] = True

engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an async DB session."""
    async with async_session_factory() as session:
        yield session
        await session.commit()


async def init_db() -> None:
    """Create all tables defined in models (for development).

    In production, use Alembic migrations instead:
        alembic upgrade head
    """
    from backend.models import Base  # noqa: F811

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
