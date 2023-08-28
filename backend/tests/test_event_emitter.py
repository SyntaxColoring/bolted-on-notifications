import asyncio

from bolts._event_emitter import EventBroadcaster


def test_event_broadcaster() -> None:
    async def test() -> None:
        coro_1_is_subscribed = asyncio.Event()
        received_by_1: list[str] = []
        coro_2_is_subscribed = asyncio.Event()
        received_by_2: list[str] = []

        subject = EventBroadcaster[str | None]()

        async def receive_coro_1() -> None:
            with subject.subscribe() as event_stream:
                coro_1_is_subscribed.set()
                async for event in event_stream:
                    if event is None:
                        break
                    else:
                        received_by_1.append(event)

        async def receive_coro_2() -> None:
            with subject.subscribe() as event_stream:
                coro_2_is_subscribed.set()
                async for event in event_stream:
                    if event is None:
                        break
                    else:
                        received_by_2.append(event)

        async with asyncio.TaskGroup() as task_group:
            task_group.create_task(receive_coro_1())
            await coro_1_is_subscribed.wait()
            subject.publish("A")
            task_group.create_task(receive_coro_2())
            await coro_2_is_subscribed.wait()
            subject.publish("B")
            subject.publish(None)

        assert received_by_1 == ["A", "B"]
        assert received_by_2 == ["B"]

    asyncio.run(test())
