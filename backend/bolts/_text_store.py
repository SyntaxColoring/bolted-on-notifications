from __future__ import annotations

import dataclasses
import datetime

from ._event_emitter import EventEmitter, ReadOnlyEventEmitter


class TextStore:
    def __init__(
        self, initial_text: str, initial_modified_at: datetime.datetime
    ) -> None:
        self._text = initial_text
        self._last_modified_at = initial_modified_at
        self._times_modified = 0
        self._event_emitter = EventEmitter[None]()

    def set(self, text: str, modified_at: datetime.datetime) -> None:
        self._text = text
        self._last_modified_at = modified_at
        self._times_modified += 1
        self._event_emitter.publish(None)

    def get(self) -> TextRecord:
        return TextRecord(
            text=self._text,
            last_modified_at=self._last_modified_at,
            etag=str(self._times_modified),
        )

    @property
    def event_emitter(self) -> ReadOnlyEventEmitter[None]:
        return self._event_emitter


@dataclasses.dataclass
class TextRecord:
    text: str
    last_modified_at: datetime.datetime
    etag: str
