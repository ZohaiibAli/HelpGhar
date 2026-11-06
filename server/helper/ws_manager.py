"""
In-process registry of live WebSocket connections, keyed by account.

One account can hold several sockets at once (phone + laptop + a second
tab), so every key maps to a *set* of sockets and every delivery fans out
across all of them. That is what makes a message you send on your laptop
appear on your phone without a refresh.

Scope note: this state lives in the worker process. A single uvicorn
process -- how this app runs today, and how it runs on Render/Railway --
is fully served by it. If the API is ever scaled to multiple processes,
this class is the one piece that needs replacing with a shared pub/sub
backend (Redis channels being the usual choice); nothing above it would
have to change, because everything already goes through `send_to_keys`.
"""

import asyncio
import logging
from collections import defaultdict
from typing import Any, Dict, Iterable, Set

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:

    def __init__(self):
        self._connections: Dict[str, Set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, key: str, websocket: WebSocket) -> bool:
        """
        Registers an already-accepted socket.

        Returns True when this is the account's *first* live socket --
        i.e. when they just came online and their contacts should be
        told. Later tabs return False so presence isn't re-announced.
        """

        async with self._lock:
            was_offline = not self._connections[key]
            self._connections[key].add(websocket)

        return was_offline

    async def disconnect(self, key: str, websocket: WebSocket) -> bool:
        """
        Unregisters a socket. Returns True when it was the account's last
        one -- they are now genuinely offline.
        """

        async with self._lock:
            sockets = self._connections.get(key)

            if not sockets:
                return False

            sockets.discard(websocket)

            if sockets:
                return False

            # Don't leave an empty set behind: `is_online` and the
            # dict itself would grow without bound over a long uptime.
            self._connections.pop(key, None)

            return True

    def is_online(self, key: str) -> bool:
        return bool(self._connections.get(key))

    def online_among(self, keys: Iterable[str]) -> Set[str]:
        return {key for key in keys if self.is_online(key)}

    async def send_to_keys(self, keys: Iterable[str], payload: Any):
        """
        Best-effort fan-out. A socket that has died without a clean close
        raises on send; it is dropped rather than allowed to break
        delivery to everyone else on the same event.
        """

        # Snapshot under the lock, then send outside it -- a slow client
        # must not hold up registration for every other connection.
        async with self._lock:
            targets = [
                (key, socket)
                for key in set(keys)
                for socket in self._connections.get(key, set())
            ]

        if not targets:
            return

        results = await asyncio.gather(
            *(socket.send_json(payload) for _, socket in targets),
            return_exceptions=True,
        )

        dead = [
            (key, socket)
            for (key, socket), result in zip(targets, results)
            if isinstance(result, Exception)
        ]

        if not dead:
            return

        async with self._lock:
            for key, socket in dead:
                sockets = self._connections.get(key)

                if not sockets:
                    continue

                sockets.discard(socket)

                if not sockets:
                    self._connections.pop(key, None)

        logger.debug("Dropped %d dead messaging socket(s)", len(dead))


manager = ConnectionManager()
