"""Async database connection and session management."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from backend.config import settings


def normalize_database_url(url: str) -> str:
    """Ensure database URL has the correct async driver scheme.

    Translates standard postgresql:// or postgres:// to postgresql+asyncpg://,
    and sqlite:/// to sqlite+aiosqlite:///.
    """
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("sqlite:///") and not url.startswith("sqlite+aiosqlite:///"):
        return url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
    return url


# ── Engine ──────────────────────────────────────────────────────────────────
DATABASE_URL = normalize_database_url(settings.DATABASE_URL)
_is_postgres = DATABASE_URL.startswith("postgresql")

engine_kwargs: dict[str, object] = {
    "echo": settings.DEBUG,
}

if _is_postgres:
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 3600

engine = create_async_engine(DATABASE_URL, **engine_kwargs)

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
