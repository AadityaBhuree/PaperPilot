"""Shared pagination schemas and helpers for list endpoints."""

from __future__ import annotations

import math
from typing import Generic, TypeVar

from fastapi import Query
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Pagination query parameters (use as FastAPI dependency)
# ---------------------------------------------------------------------------

T = TypeVar("T")


class PaginationParams:
    """FastAPI dependency — inject ``page`` and ``page_size`` query params.

    Usage::

        @router.get("/items")
        async def list_items(p: PaginationParams = Depends()):
            ...
    """

    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number (1-indexed)"),
        page_size: int = Query(20, ge=1, le=100, alias="pageSize", description="Items per page"),
    ) -> None:
        self.page = page
        self.page_size = page_size
        self.offset = (page - 1) * page_size


# ---------------------------------------------------------------------------
# Paginated response envelope
# ---------------------------------------------------------------------------


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated list response."""

    items: list[T] = Field(description="Page of results")
    total: int = Field(description="Total number of items across all pages")
    page: int = Field(description="Current page number (1-indexed)")
    page_size: int = Field(description="Number of items per page")
    total_pages: int = Field(description="Total number of pages")

    model_config = {"populate_by_name": True}


def build_paginated_response(
    items: list[T],
    total: int,
    params: PaginationParams,
) -> PaginatedResponse[T]:
    """Build a ``PaginatedResponse`` from query results and pagination params."""
    return PaginatedResponse(
        items=items,
        total=total,
        page=params.page,
        page_size=params.page_size,
        total_pages=max(1, math.ceil(total / params.page_size)) if params.page_size > 0 else 1,
    )
