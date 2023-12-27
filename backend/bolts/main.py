import asyncio
import contextlib
import datetime
import logging
import logging_tree
import typing

import fastapi
import fastapi.middleware.cors
import socketio

from . import _http_models
from ._motd_store import MOTDStore
from . import _socketio_helpers


_log = logging.getLogger(__name__)
_socketio_log = logging.getLogger("python-socketio")
_engineio_log = logging.getLogger("python-engineio")

_fastapi_app = fastapi.FastAPI()

_fastapi_app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=("*"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@_fastapi_app.middleware("http")
async def _add_default_cache_control(
    request: fastapi.Request,
    call_next: typing.Callable[[fastapi.Request], typing.Awaitable[fastapi.Response]],
) -> fastapi.Response:
    """Add a default `Cache-Control: no-cache` header to responses that don't have one.

    `no-cache` means that when the client requests a resource that it's retrieved
    before, it should always ask the server to see if that resource has updated.
    This is a good safe default for dynamic APIs.

    Without any `Cache-Control` header, the client would use its own heuristics, which
    may not be as safe.

    Beware that the name `no-cache` is kind of a misnomer. The server can still reply
    with 304-not-modified, making the client return the resource from its cache.

    We need to implement this as a middleware instead of as a FastAPI dependency.
    If you modify the response headers through a FastAPI dependency, they get
    overwritten by the headers in `fastapi.Response` objects, not merged with them.
    """
    response = await call_next(request)
    if "cache-control" not in response.headers:
        response.headers["cache-control"] = "no-cache"
    return response


def _now() -> datetime.datetime:
    return datetime.datetime.now(tz=datetime.UTC)


def _weak_etag(raw_etag: str) -> str:
    return f'W/"{raw_etag}"'


_motd_store = MOTDStore(initial_motd="default MOTD", initial_modified_at=_now())


@_fastapi_app.get("/motd")
async def get_motd(request: fastapi.Request) -> fastapi.Response:
    result = _motd_store.get()
    etag = _weak_etag(result.etag)
    if request.headers.get("if-none-match") == etag:
        return fastapi.responses.Response(
            status_code=fastapi.status.HTTP_304_NOT_MODIFIED
        )
    else:
        return fastapi.responses.PlainTextResponse(
            content=_http_models.GetMOTDResponse(
                motd=result.motd, lastModifiedAt=result.last_modified_at
            ).json(),
            headers={
                "ETag": _weak_etag(result.etag),
                "Content-Type": "application/json",
            },
        )


@_fastapi_app.put("/motd")
async def put_motd(
    request: _http_models.PutMOTDRequest,
) -> fastapi.Response:
    _motd_store.set(motd=request.motd, modified_at=_now())
    result = _motd_store.get()
    return fastapi.responses.PlainTextResponse(
        content=_http_models.GetMOTDResponse(
            motd=result.motd, lastModifiedAt=result.last_modified_at
        ).json(),
        headers={
            "ETag": result.etag,
            "Content-Type": "application/json",
        },
    )


# TODO: Look into async_handlers param. Seems like suspicious unsafe threading.
_sio_server = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=_socketio_log,  # type: ignore[arg-type]
    engineio_logger=_engineio_log,
)
_sio_app = socketio.ASGIApp(
    socketio_server=_sio_server,
    # TODO: It may be easier to have FastAPI forward to Socket.IO instead of the
    # other way around, for handling things like CORS headers.
    other_asgi_app=_fastapi_app,
)


@_socketio_helpers.on_event(_sio_server, "subscribe")
async def _handle_subscribe(sid: str, data: object) -> object:
    queue = asyncio.Queue[None]()

    async def coroutine() -> None:
        while True:
            await queue.get()
            # The python-socketio docs warn against calling emit() concurrently.
            # We're relying on each connection will only ever being emitted to by one task.
            _log.info(f"Delivering notification to {sid}.")
            await _sio_server.emit(to=sid, event="notification", data={})

    exit_stack = contextlib.AsyncExitStack()
    exit_stack.enter_context(_motd_store.event_emitter.subscribed(queue.put_nowait))

    task = asyncio.create_task(coroutine())

    async def clean_up_task() -> None:
        _log.debug("clean_up_task()")
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task

    exit_stack.push_async_callback(clean_up_task)

    async def handle_disconnect(disconnected_sid: str) -> None:
        _log.info(f"on disconnect, {disconnected_sid}")
        if disconnected_sid != sid:
            return
        _log.info(f"Disconnecting {sid}...")
        # TODO: Remove this event listener now.
        try:
            await exit_stack.aclose()
        except:
            _log.exception(f"Exception disconnecting {sid}.")
        else:
            _log.info(f"Disconnected {sid}.")

    _socketio_helpers.on_disconnect(_sio_server, handle_disconnect)

    _log.info(f"Subscribed {sid}.")
    return {}


# TODO: Belongs elsewhere, in uvicorn or global config.
logging.basicConfig(level="DEBUG")
_log.info("Starting up.")
logging_tree.printout()
app = _sio_app
