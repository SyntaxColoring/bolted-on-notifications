import datetime
import typing

from ._event_emitter import EventEmitter, ReadOnlyEventEmitter


class MOTDStore:
    def __init__(
        self, initial_motd: str, initial_modified_at: datetime.datetime
    ) -> None:
        self._motd = initial_motd
        self._last_modified_at = initial_modified_at
        self._event_emitter = EventEmitter[None]()

    def set(self, motd: str, modified_at: datetime.datetime) -> None:
        self._motd = motd
        self._last_modified_at = modified_at
        self._event_emitter.publish(None)

    def get(self) -> typing.Tuple[str, datetime.datetime]:
        return self._motd, self._last_modified_at

    @property
    def event_emitter(self) -> ReadOnlyEventEmitter[None]:
        return self._event_emitter
