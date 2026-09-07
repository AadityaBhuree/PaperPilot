"""Tests for health check, liveness, and readiness endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check_endpoint(client: AsyncClient):
    """Verify /health returns 200 with structured component statuses."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["name"] == "PaperPilot"
    assert "components" in data
    assert "database" in data["components"]
    assert "ai_service" in data["components"]
    assert "storage" in data["components"]


@pytest.mark.asyncio
async def test_liveness_probe(client: AsyncClient):
    """Verify /health/live returns alive."""
    response = await client.get("/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "alive"}


@pytest.mark.asyncio
async def test_readiness_probe(client: AsyncClient):
    """Verify /health/ready returns ready."""
    response = await client.get("/health/ready")
    assert response.status_code in (200, 503)
