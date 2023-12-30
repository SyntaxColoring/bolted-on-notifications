import abc
import contextlib
import logging
import typing


_log = logging.getLogger(__name__)

_EventT = typing.TypeVar("_EventT")
_Callback = typing.Callable[[_EventT], None]


class ReadOnlyEventEmitter(abc.ABC, typing.Generic[_EventT]):
    @abc.abstractmethod
    def subscribe(self, callback: _Callback) -> typing.Callable[[], None]:
        pass

    @abc.abstractmethod
    @contextlib.contextmanager
    def subscribed(self, callback: _Callback) -> typing.Generator[None, None, None]:
        pass


class EventEmitter(typing.Generic[_EventT], ReadOnlyEventEmitter[_EventT]):
    def __init__(self) -> None:
        self._subscribed_callbacks: set[_Callback] = set()

    def publish(self, event: _EventT) -> None:
        for callback in self._subscribed_callbacks:
            callback(event)

    def subscribe(self, callback: _Callback) -> typing.Callable[[], None]:
        # Wrap the callback so that if the caller subscribes the same callback multiple
        # times, we treat each one as its own unique function, so they don't all get
        # removed when the first one unsubscribes.
        def wrapped_callback(event: _EventT) -> None:
            callback(event)

        self._subscribed_callbacks.add(wrapped_callback)
        _log.debug(
            f"Added callback {callback}, callbacks are now {len(self._subscribed_callbacks)}"
        )

        def unsubscribe() -> None:
            self._subscribed_callbacks.remove(wrapped_callback)
            _log.debug(
                f"Removed callback {callback}, callbacks are now {len(self._subscribed_callbacks)}"
            )

        return unsubscribe

    @contextlib.contextmanager
    def subscribed(self, callback: _Callback) -> typing.Generator[None, None, None]:
        unsubscribe = self.subscribe(callback)
        try:
            yield
        finally:
            unsubscribe()
