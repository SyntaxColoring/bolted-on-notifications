import datetime
import enum

import pydantic


class PutTextRequest(pydantic.BaseModel):
    text: str


class GetTextResponse(pydantic.BaseModel):
    text: str
    lastModifiedAt: datetime.datetime


class ButtonID(enum.Enum):
    RED = "red"
    GREEN = "green"
    BLUE = "blue"
    YELLOW = "yellow"


class PostButtonRequest(pydantic.BaseModel):
    pass


class GetButtonResponse(pydantic.BaseModel):
    timesClicked: int


class PostPostRequest(pydantic.BaseModel):
    title: str
    body: str


class GetPostResponse(pydantic.BaseModel):
    id: str
    title: str
    body: str


class PostTitleOnly(pydantic.BaseModel):
    title: str


class GetAllPostsResponse(pydantic.BaseModel):
    data: list[GetPostResponse]


class GetAllPostsResponseTitlesOnly(pydantic.BaseModel):
    data: list[PostTitleOnly]
