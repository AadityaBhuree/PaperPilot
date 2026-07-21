"""Server-Sent Events (SSE) manager for real-time async job progress broadcasting."""

import asyncio
import json
import logging
from typing import AsyncGenerator

logger = logging.getLogger(__name__)


class SSEManager:
    """Manages active EventSource streaming subscriptions per client/job."""

    def __init__(self):
        self._subscribers: dict[str, set[asyncio.Queue]] = {}

    def subscribe(self, channel_id: str) -> asyncio.Queue:
        """Subscribe to progress updates for a channel/job."""
        queue: asyncio.Queue = asyncio.Queue()
        if channel_id not in self._subscribers:
            self._subscribers[channel_id] = set()
        self._subscribers[channel_id].add(queue)
        logger.info("Subscribed queue to channel %s", channel_id)
        return queue

    def unsubscribe(self, channel_id: str, queue: asyncio.Queue) -> None:
        """Remove a subscriber queue."""
        if channel_id in self._subscribers:
            self._subscribers[channel_id].discard(queue)
            if not self._subscribers[channel_id]:
                del self._subscribers[channel_id]
            logger.info("Unsubscribed queue from channel %s", channel_id)

    async def publish(self, channel_id: str, data: dict) -> None:
        """Publish a JSON payload event to all subscribers of a channel."""
        if channel_id not in self._subscribers:
            return

        message = json.dumps(data)
        queues = list(self._subscribers[channel_id])
        for q in queues:
            await q.put(message)

    async def event_generator(self, channel_id: str, queue: asyncio.Queue) -> AsyncGenerator[str, None]:
        """Yield formatted SSE data lines for FastAPI EventSourceResponse."""
        try:
            while True:
                data = await queue.get()
                yield f"data: {data}\n\n"
        except asyncio.CancelledError:
            self.unsubscribe(channel_id, queue)
            raise


sse_manager = SSEManager()
