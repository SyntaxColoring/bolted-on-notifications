import asyncio
import contextlib
import typing


_EventT = typing.TypeVar("_EventT")


class EventBroadcaster(typing.Generic[_EventT]):
    def __init__(self) -> None:
        self._subscriber_queues: set[asyncio.Queue[_EventT]] = set()

    # TODO: Backpressure?
    def publish(self, event: _EventT) -> None:
        for queue in self._subscriber_queues:
            queue.put_nowait(event)

    @contextlib.contextmanager
    def subscribe(self) -> typing.Generator[typing.AsyncIterator[_EventT], None, None]:
        queue = asyncio.Queue[_EventT]()

        async def receive_events() -> typing.AsyncIterator[_EventT]:
            while True:
                yield await queue.get()

        self._subscriber_queues.add(queue)

        try:
            yield receive_events()
        finally:
            self._subscriber_queues.remove(queue)


