"""Structured HTTP request and response logging middleware with request tracing."""

import logging
import time
import uuid
from collections.abc import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("backend.access")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware that assigns a unique request ID, measures response latency,

    and emits structured access log records for monitoring and audit trails.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Extract existing X-Request-ID or generate a new UUIDv4
        request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
        request.state.request_id = request_id

        start_time = time.perf_counter()
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        method = request.method
        path = request.url.path
        if request.url.query:
            path = f"{path}?{request.url.query}"

        try:
            response = await call_next(request)
            duration_ms = (time.perf_counter() - start_time) * 1000.0

            # Attach X-Request-ID to response header for distributed tracing
            response.headers["X-Request-ID"] = request_id

            logger.info(
                "[%s] %s %s - %d (%.2fms) | IP: %s | UA: %s",
                request_id[:8],
                method,
                path,
                response.status_code,
                duration_ms,
                client_ip,
                user_agent,
            )
            return response

        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            logger.error(
                "[%s] %s %s - FAILED with %s (%.2fms) | IP: %s",
                request_id[:8],
                method,
                path,
                exc.__class__.__name__,
                duration_ms,
                client_ip,
                exc_info=True,
            )
            raise exc
