import datetime

import pydantic


class PutMOTDRequest(pydantic.BaseModel):
    motd: str


class GetMOTDResponse(pydantic.BaseModel):
    motd: str
    lastModifiedAt: datetime.datetime


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
