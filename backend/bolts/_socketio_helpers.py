"""Helpers wrapping the python-socketio library.

Addresses the lack of type annotations:
https://github.com/miguelgrinberg/python-socketio/issues/1276

And the lack of exception logging if a socketio event handler raises something.
"""


import functools
import logging
import typing

import socketio


_log = logging.getLogger()


DisconnectHandler = typing.Callable[
    [str], typing.Awaitable[None]  # Takes the sid (session ID).
]
EventHandler = typing.Callable[
    # Takes the sid (session ID) and input data object. Returns a data object.
    [str, object], typing.Awaitable[object]
]


@typing.overload
def on_disconnect(
    server: socketio.AsyncServer,
    handler: None = None,
    namespace: str | None = None,
) -> typing.Callable[[DisconnectHandler], DisconnectHandler]:
    pass


@typing.overload
def on_disconnect(
    server: socketio.AsyncServer,
    handler: DisconnectHandler,
    namespace: str | None = None,
) -> None:
    pass


def on_disconnect(
    server: socketio.AsyncServer,
    handler: DisconnectHandler | None = None,
    namespace: str | None = None,
) -> typing.Callable[[DisconnectHandler], DisconnectHandler] | None:
    def decorate(handler: DisconnectHandler) -> DisconnectHandler:
        @functools.wraps(handler)
        async def decorated(*args, **kwargs) -> None:
            try:
                await handler(*args, **kwargs)
            except:
                _log.exception(
                    "Unhandled exception handling Socket.IO disconnect."
                    + f" (Args {args}, kwargs {kwargs})."
                )
                # TODO: Consider propagating this to the client instead of
                # re-raising it here, because nothing will catch this and it will
                # print an ugly warning.
                raise

        server.on("disconnect", decorated, namespace)
        return decorated

    if handler is None:
        return decorate
    else:
        decorate(handler)


@typing.overload
def on_event(
    server: socketio.AsyncServer,
    event_name: str,
    handler: None = None,
    namespace: str | None = None,
) -> typing.Callable[[EventHandler], EventHandler]:
    pass


@typing.overload
def on_event(
    server: socketio.AsyncServer,
    event_name: str,
    handler: EventHandler,
    namespace: str | None = None,
) -> None:
    pass


def on_event(
    server: socketio.AsyncServer,
    event_name: str,
    handler: EventHandler | None = None,
    namespace: str | None = None,
) -> typing.Callable[[EventHandler], EventHandler] | None:
    def decorate(handler: EventHandler) -> EventHandler:
        @functools.wraps(handler)
        async def decorated(*args, **kwargs) -> object:
            try:
                return await handler(*args, **kwargs)
            except:
                _log.exception(
                    "Unhandled exception handling Socket.IO event."
                    + f" (Args {args}, kwargs {kwargs})."
                )
                # TODO: Consider propagating this to the client instead of
                # re-raising it here, because nothing will catch this and it will
                # print an ugly warning.
                raise

        server.on(event_name, decorated, namespace)
        return decorated

    if handler is None:
        return decorate
    else:
        decorate(handler)
