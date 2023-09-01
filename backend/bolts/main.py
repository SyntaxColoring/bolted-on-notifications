import asyncio
import contextlib
import dataclasses
import typing
import uuid

import msgspec
import msgspec.json

import starlette.applications
import starlette.requests
import starlette.responses
from starlette.routing import Route, WebSocketRoute
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocket


from ._event_emitter import EventBroadcaster



class PostPostRequest(msgspec.Struct):
    title: str
    body: str


class GetPostResponse(msgspec.Struct):
    id: str
    title: str
    body: str


class PostTitleOnly(msgspec.Struct):
    title: str


class GetAllPostsResponse(msgspec.Struct):
    data: list[GetPostResponse]


class GetAllPostsResponseTitlesOnly(msgspec.Struct):
    data: list[PostTitleOnly]


class QueryParamAsJSON(msgspec.Struct):
    name: str
    value: str


class SubscriptionRequest(msgspec.Struct):
    requestID: str
    urlPath: list[str]
    queryParams: list[QueryParamAsJSON] | msgspec.UnsetType = msgspec.UNSET
    # TODO: Headers, etc.


class SubscriptionResponse(msgspec.Struct):
    requestID: str
    subscriptionID: str
    messageType: typing.Literal["subscribeResponse"] = "subscribeResponse"


class SubscriptionNotificaton(msgspec.Struct):
    subscriptionID: str
    messageType: typing.Literal["subscriptionNotification"] = "subscriptionNotification"


@dataclasses.dataclass
class Post:
    id: str
    title: str
    body: str


@dataclasses.dataclass
class PostUpdatedEvent:
    id: str


@dataclasses.dataclass
class PostAddedEvent:
    id: str


@dataclasses.dataclass
class PostDeletedEvent:
    id: str


# TODO: Okay, how do we compose these events if there are containing resources?
class PostStore:
    def __init__(self) -> None:
        self._posts: dict[str, Post] = {}
        self._event_broadcaster = EventBroadcaster[PostUpdatedEvent | PostAddedEvent | PostDeletedEvent]()

    @property
    def event_broadcaster(self) -> EventBroadcaster[PostUpdatedEvent | PostAddedEvent | PostDeletedEvent]:
        return self._event_broadcaster

    def add(self, new_post: Post) -> None:
        assert new_post.id not in self._posts
        self._posts[new_post.id] = new_post
        self._event_broadcaster.publish(PostAddedEvent(id=new_post.id))

    def update(self, new_post: Post) -> None:
        assert new_post.id in self._posts
        self._posts[new_post.id] = new_post
        self._event_broadcaster.publish(PostUpdatedEvent(id=new_post.id))

    def delete(self, id: str) -> None:
        del self._posts[id]
        self._event_broadcaster.publish(PostDeletedEvent(id=id))

    def get(self, id: str) -> Post:
        return self._posts[id]

    def get_all(self) -> list[Post]:
        return list(self._posts.values())


post_store = PostStore()


async def _get_all_posts(titles_only: bool) -> GetAllPostsResponse | GetAllPostsResponseTitlesOnly:
    if titles_only:
        return GetAllPostsResponseTitlesOnly(
            data=[PostTitleOnly(title=p.title) for p in post_store.get_all()]
        )
    else:
        return GetAllPostsResponse(
            data=[GetPostResponse(id=p.id, title=p.title, body=p.body) for p in post_store.get_all()]
        )


async def get_all_posts(request: starlette.requests.Request):
    field_set = request.query_params.get("fieldSet", "all")
    if field_set not in {"all", "titlesOnly"}:
        raise ValueError(field_set)

    result = await _get_all_posts(titles_only=field_set == "titlesOnly")

    return starlette.responses.Response(
        content=msgspec.json.encode(result),
        media_type="application/json",
    )


async def get_post(request: starlette.requests.Request) -> None:
    raise NotImplementedError


async def _post_post(title: str, body: str) -> Post:
    id = str(uuid.uuid4())
    new_post = Post(id=id, title=title, body=body)
    post_store.add(new_post)
    return new_post


async def post_post(request: starlette.requests.Request) -> starlette.responses.Response:
    request_body = msgspec.json.decode(await request.body(), type=PostPostRequest)
    new_post = await _post_post(title=request_body.title, body=request_body.body)
    return starlette.responses.Response(
        content=msgspec.json.encode(new_post),
        media_type="application/json",
        status_code=201,
    )


async def delete_post(request: starlette.requests.Request):
    raise NotImplementedError


class SubscriptionHandler:
    def __init__(self, subscription_id: str, websocket: WebSocket) -> None:
        self._subscription_id = subscription_id
        self._websocket = websocket


@contextlib.asynccontextmanager
async def accept_websocket(websocket: WebSocket) -> typing.AsyncGenerator[None, None]:
    await websocket.accept()
    try:
        yield None
    except:
        # 1011="server encountered an unexpeced condition."
        # No idea if that's the appropriate code.
        await websocket.close(code=1011)
        raise
    else:
        # TODO: If the client closes the WS, we get a "double close" error message.
        await websocket.close()


async def websocket_subscribe(websocket: WebSocket) -> None:
    # TODO: Is closing a Starlette WebSocket necessary?
    # What happens if this function returns without closing it?
    # TODO: If a WebSocket is open, it seems to hang.
    # TODO: Cancel this task if the WS closes,
    async with accept_websocket(websocket), asyncio.TaskGroup() as task_group:
        async for raw_message in websocket.iter_text():
            # TODO: Specify what should happen if a request is invalid. Kill the whole connection?
            # Reply to just that request with an error and keep the connection?
            parsed_message = msgspec.json.decode(raw_message, type=SubscriptionRequest)
            if parsed_message.urlPath == ["posts"]:
                async def subscribe_to_posts():
                    with post_store.event_broadcaster.subscribe() as events:
                        async for _ in events:
                            await websocket.send_text(
                                msgspec.json.encode(
                                    SubscriptionNotificaton(
                                        subscriptionID=parsed_message.requestID,
                                    )
                                ).decode("utf-8")
                            )
                            # TODO: Backpressure.

                task_group.create_task(subscribe_to_posts())
                response = SubscriptionResponse(
                    requestID=parsed_message.requestID,
                    subscriptionID=parsed_message.requestID,
                )
                await websocket.send_text(
                    msgspec.json.encode(response).decode("utf-8")  # TODO: Is UTF-8 appropriate?
                )
            else:
                raise ValueError(parsed_message.urlPath)

    # TODO: If the client closes the connection, we need to ensure that this stuff gets wound down properly.


def route_subscription_request(request: SubscriptionRequest) -> None:
    if request.urlPath == ["posts"]:
        raise NotImplementedError
    else:
        raise ValueError


routes = [
    WebSocketRoute("/subscribe", endpoint=websocket_subscribe),
    Route("/posts", endpoint=get_all_posts, methods=["GET"]),
    Route("/posts", endpoint=post_post, methods=["POST"]),
    Route("/posts/{id}", endpoint=get_post, methods=["GET"]),
]
middleware = [
    Middleware(CORSMiddleware, allow_origins=["*"])
]
app = starlette.applications.Starlette(routes=routes, middleware=middleware)
