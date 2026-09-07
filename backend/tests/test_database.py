"""Unit tests for database connection configuration and driver normalization."""

from backend.database.connection import normalize_database_url


def test_normalize_database_url_postgresql_schemes():
    """Verify PostgreSQL standard and legacy URI schemes normalize to asyncpg driver."""
    assert normalize_database_url("postgres://user:pass@localhost:5432/db") == (
        "postgresql+asyncpg://user:pass@localhost:5432/db"
    )
    assert normalize_database_url("postgresql://user:pass@localhost:5432/db") == (
        "postgresql+asyncpg://user:pass@localhost:5432/db"
    )
    assert normalize_database_url("postgresql+asyncpg://user:pass@localhost:5432/db") == (
        "postgresql+asyncpg://user:pass@localhost:5432/db"
    )


def test_normalize_database_url_sqlite_schemes():
    """Verify SQLite schemes normalize to aiosqlite driver."""
    assert normalize_database_url("sqlite:///app.db") == (
        "sqlite+aiosqlite:///app.db"
    )
    assert normalize_database_url("sqlite+aiosqlite:///app.db") == (
        "sqlite+aiosqlite:///app.db"
    )
