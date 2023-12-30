import enum

from ._event_emitter import EventEmitter, ReadOnlyEventEmitter


class Button(enum.Enum):
    RED = enum.auto()
    GREEN = enum.auto()
    BLUE = enum.auto()
    YELLOW = enum.auto()


class ButtonStore:
    def __init__(self) -> None:
        self._times_clicked = {button: 0 for button in Button}
        self._event_emitter = EventEmitter[Button]()

    def click(self, button: Button) -> None:
        self._times_clicked[button] += 1
        self._event_emitter.publish(button)

    def get_times_clicked(self, button: Button) -> int:
        return self._times_clicked[button]

    @property
    def event_emitter(self) -> ReadOnlyEventEmitter[Button]:
        return self._event_emitter
