from __future__ import annotations

import dataclasses
import datetime

from ._event_emitter import EventEmitter, ReadOnlyEventEmitter


class MOTDStore:
    def __init__(
        self, initial_motd: str, initial_modified_at: datetime.datetime
    ) -> None:
        self._motd = initial_motd
        self._last_modified_at = initial_modified_at
        self._times_modified = 0
        self._event_emitter = EventEmitter[None]()

    def set(self, motd: str, modified_at: datetime.datetime) -> None:
        self._motd = motd
        self._last_modified_at = modified_at
        self._times_modified += 1
        self._event_emitter.publish(None)

    def get(self) -> MOTDRecord:
        return MOTDRecord(
            motd=self._motd,
            last_modified_at=self._last_modified_at,
            etag=str(self._times_modified),
        )

    @property
    def event_emitter(self) -> ReadOnlyEventEmitter[None]:
        return self._event_emitter


@dataclasses.dataclass
class MOTDRecord:
    motd: str
    last_modified_at: datetime.datetime
    etag: str
