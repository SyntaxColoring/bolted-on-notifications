import asyncio
import contextlib
import datetime
import logging
import logging_tree

import fastapi
import fastapi.middleware.cors
import socketio

from . import _http_models
from ._motd_store import MOTDStore
from . import _socketio_helpers


_log = logging.getLogger(__name__)

_fastapi_app = fastapi.FastAPI()

_fastapi_app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=("*"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _now() -> datetime.datetime:
    return datetime.datetime.now(tz=datetime.UTC)


_motd_store = MOTDStore(initial_motd="default MOTD", initial_modified_at=_now())


@_fastapi_app.get("/motd")
async def get_motd() -> _http_models.GetMOTDResponse:
    motd, last_modified_at = _motd_store.get()
    return _http_models.GetMOTDResponse(motd=motd, lastModifiedAt=last_modified_at)


@_fastapi_app.put("/motd")
async def put_motd(
    request: _http_models.PutMOTDRequest,
) -> _http_models.GetMOTDResponse:
    _motd_store.set(motd=request.motd, modified_at=_now())
    motd, last_modified_at = _motd_store.get()
    return _http_models.GetMOTDResponse(motd=motd, lastModifiedAt=last_modified_at)


# TODO: Look into async_handlers param. Seems like suspicious unsafe threading.
_sio_server = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
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
