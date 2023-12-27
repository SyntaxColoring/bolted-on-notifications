from ._event_emitter import EventEmitter, ReadOnlyEventEmitter


class ButtonStore:
    def __init__(self) -> None:
        self._times_clicked = 0
        self._event_emitter = EventEmitter[None]()

    def click(self) -> None:
        self._times_clicked += 1
        self._event_emitter.publish(None)

    def get_times_clicked(self) -> int:
        return self._times_clicked

    @property
    def event_emitter(self) -> ReadOnlyEventEmitter[None]:
        return self._event_emitter
