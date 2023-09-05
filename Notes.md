A request has input:
- URL path
- Headers
- Query parameters
- Form parameters maybe

And output:
- Body
- Headers
  - Including cache


We want input resources and subresources to be individually cacheable.


We don't want notifications to be triggered if part of a resource updates that you don't care about


We want to trigger watchers minimally, but still have the flexibility to trigger them incrementally when needed.


Interactions between:
- Pages
- Query params and headers
- Caches (both automatically handled when we know nothing has changed, and when a hash is given to us by the resolver)
- Linked subresources

- Schema


POST blog posts with titles and contents
Subscribe to individual posts or all of them
Pages







Challenge with etags:
Ideally, we might want to return something like this:
```json
[
    {
        "data": {
            "title": "...",
            "body": "..."
        },
        "cache": {
            "etag": "abc123"
        }
    },
    {
        "data": {
            "title": "...",
            "body": "...",
        },
        "cache": {
            "etag": "def456"
        }
    }
]
```

But with different fieldsets, does the etag correspond to the full resource, or just the fieldset that appears in the list response, or something else? What if you're polling a window of run commands summaries in order to see if you need to fetch the full commands?


Maybe the answer is "just subscribe to each command in that window" and don't put etag caches in the list response. Then, for scrolling the window to be performant, we need to give clients a way to batch-unsubscribe and batch-subscribe; there can't be a round-trip between subscriptions.





If you're monitoring a resource and then POST/PUT to that resource, theoretically you can already invalidate it manually, without fancy subscriptions, because you know your POST has changed it.
If we don't do that, there will be a delay after POSTing until the loading state happens.
If we do do that, there will be a double-fetch? Once because we invalidated it in JS manually after our POST, and once because a notification came in for it?





TODO:

Open a WebSocket or use the existing one
    Possibly propagate errors

On that WebSocket, subscribe to the given endpoint or reuse the existing subscription if there is one
    Possibly propagate errors

After that subscription is confirmed, enable TanStack querying
    Possibly propagate errors

If WebSocket disconnects, reconnect automatically, maybe with a timeout



// TODO:
// Parent connection WS thing with reconnection
// Logical multiplexed subscription inner connection
// useEffect so sub/unsub from logical multiplexed subscription thin



Post add, edit, delete, just locally first




TODO: Consider switching from individual sub/unsub messages to an idempotent "setSubscriptions" message. More self-descriptive on the network, and easier to implement on the client. But chattier.


TODO: Add a debug message type?


TODO: Pick a WS subprotocol string/number.



# Design goals

* Must be implementable in modern native browser APIs. This precludes some WebSocket features like ping/pong, or relying on TCP backpressure.


# Limitations

When the client is a web browser, it can't exert backpressure on the server because of limitations in the browser API for WebSockets.
https://developer.chrome.com/en/articles/websocketstream/
https://stackoverflow.com/questions/19414277/can-i-have-flow-control-on-my-websockets



