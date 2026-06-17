"""Shared SQLAlchemy declarative base for all models."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Single shared base class for all ORM models in PaperPilot."""
