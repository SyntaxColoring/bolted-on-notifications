import pydantic


class SubscribeRequest(pydantic.BaseModel):
    path: list[str]
