import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BASE_URL } from './urls'
import ReconnectingWebSocket from 'reconnecting-websocket'
import { useEffect, useState } from 'react'
import * as wsModels from './ws-models'
import { z } from "zod"
import { allPostsSchema, AllPosts } from './http_models'
import { wsRequest } from './ws-utils'

type SubscriptionRequest = z.infer<typeof wsModels.subscribeRequestSchema>;

// TODO: Also expose the WebSocket connection status and/or the logical subconnection status,
// so the caller knows more than just that the query is idle for some reason.
export function usePosts(webSocket: ReconnectingWebSocket) {
    const queryClient = useQueryClient()
    const queryKey: string[] = ["posts"]

    // TODO: Figure out how to move the knowledge that the initial state is "false"
    // into subscribe(). Ideally, we'd use useSyncExternalStore or something.
    const [subscriptionConnected, setSubscriptionConnected] = useState(false)

    useEffect(
        () => {
            const unsubscribe = subscribe(
                webSocket,
                queryKey,
                () => {
                    console.log("It's a notification.")
                    queryClient.invalidateQueries(queryKey)
                },
                setSubscriptionConnected
            )
            return unsubscribe
        },
        [webSocket]
    )

    return useQuery({
        queryKey: queryKey,
        queryFn: getPosts,
        staleTime: Infinity,
        enabled: subscriptionConnected
    })
}

// TODO: Figure out caching of the subscription logical connections.
function subscribe(
    webSocket: ReconnectingWebSocket,
    urlPath: string[],
    onNotification: () => void,
    setSubscriptionConnected: (newSubscriptionConnected: boolean) => void
): () => void {
    console.log("Subscribing.")

    const requestID = generateID()
    let subscriptionID: null | string = null

    const setUpSubscription = () => {
        console.log("WS connected. Setting up subscription.")
        const subscribeRequest: wsModels.SubscribeRequest = {
            messageType: "subscribeRequest",
            requestID,
            urlPath
        }
        wsSubscribeRequest(webSocket, subscribeRequest).then((subscribeResponse) => {
            subscriptionID = subscribeResponse.subscriptionID
            setSubscriptionConnected(true)
            // TODO: Do I need to do anything special here to make sure errors are logged?
        })
    }

    const handleMessage = (event: MessageEvent) => {
        const parsedResponse = wsModels.anyFromServerSchema.parse(JSON.parse(event.data))
        if (parsedResponse.messageType === "subscriptionNotification" && parsedResponse.subscriptionID === subscriptionID) {
            onNotification()
        }
    }

    const handleDisconnection = () => {
        subscriptionID = null
        setSubscriptionConnected(false)
    }

    webSocket.addEventListener("open", setUpSubscription)
    if (webSocket.readyState === webSocket.OPEN) { setUpSubscription() }
    webSocket.addEventListener("message", handleMessage)
    webSocket.addEventListener("close", handleDisconnection)

    const cleanUp = () => {
        console.log("Cleaning up.")
        // FIXME: I think this is a bug that will leak subscriptions.
        // If the WebSocket is open but we don't have a subscriptionID yet,
        // we need to wait until we do and then unsubscribe it.
        // (TODO: This is an obnoxious part of the protocol and we should fix it.)
        if (webSocket.readyState == webSocket.OPEN && subscriptionID != null) {
            const message: wsModels.UnsubscribeRequest = {
                messageType: "unsubscribeRequest",
                requestID: generateID(),
                subscriptionID
            }
            webSocket.send(JSON.stringify(message))
            // TODO: Do I have to do anything special to log an error here?
        }
        webSocket.removeEventListener("open", setUpSubscription)
        webSocket.removeEventListener("message", handleMessage)
        webSocket.removeEventListener("close", handleDisconnection)
    }

    return cleanUp
}

function useWebSocketStatus(webSocket: ReconnectingWebSocket): number {
    const [status, setStatus] = useState(webSocket.readyState)
    const refreshStatus = () => {
        console.log("Refreshing WebSocket status.", webSocket.readyState)
        setStatus(webSocket.readyState)
    }
    useEffect(
        () => {
            webSocket.addEventListener("open", refreshStatus)
            webSocket.addEventListener("close", refreshStatus)

            return () => {
                webSocket.removeEventListener("open", refreshStatus)
                webSocket.removeEventListener("close", refreshStatus)
            }
        },
        [webSocket]
    )

    return status
}

async function getPosts(): Promise<AllPosts> {
    const result = await fetch(`${BASE_URL}/posts`)
    if (!result.ok) throw Error("Fetch result not OK.")
    return allPostsSchema.parse(await result.json())
}

function generateID(): string {
    return Date.now().toString() // FIXME
}

async function wsSubscribeRequest(webSocket: ReconnectingWebSocket, request: wsModels.SubscribeRequest): Promise<wsModels.SubscribeResponse> {
    const response = await wsRequest(webSocket, request)
    if (response.messageType != "subscribeResponse") {
        // TODO: See if we can coalesce this check into wsRequest.
        throw Error("Expected subscribeResponse messageType but got something else.")
    }
    return response
}
