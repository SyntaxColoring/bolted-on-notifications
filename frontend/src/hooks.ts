import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BASE_URL } from './urls'
import ReconnectingWebSocket from 'reconnecting-websocket'
import { useEffect, useState } from 'react'
import * as wsModels from './ws-models'
import { z } from "zod"
import { allPostsSchema, AllPosts } from './http_models'
import { wsRequest } from './ws-utils'

type SubscriptionRequest = z.infer<typeof wsModels.subscribeRequestSchema>;

export function usePosts(webSocket: ReconnectingWebSocket) {
    const queryClient = useQueryClient()
    const queryKey: string[] = ["posts"]

    useEffect(
        () => {
            const unsubscribe = subscribe(webSocket, queryKey, () => {
                console.log("It's a notification.")
                queryClient.invalidateQueries(queryKey)
            })
            return unsubscribe
        },
        [webSocket]
    )

    return useQuery({
        queryKey: queryKey,
        queryFn: getPosts,
        staleTime: Infinity,
    })
}

// TODO: Figure out caching of the subscription logical connections.
function subscribe(
    webSocket: ReconnectingWebSocket,
    urlPath: string[],
    onNotification: () => void
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
    }

    webSocket.addEventListener("open", setUpSubscription)
    if (webSocket.readyState === webSocket.OPEN) { setUpSubscription() }
    webSocket.addEventListener("message", handleMessage)
    webSocket.addEventListener("close", handleDisconnection)

    const cleanUp = () => {
        console.log("Cleaning up.")
        // TODO: Actually send an unsubscribe message on the WebSocket, if it's still open.
        webSocket.removeEventListener("open", setUpSubscription)
        webSocket.removeEventListener("message", handleMessage)
        webSocket.removeEventListener("close", handleDisconnection)
    }

    return cleanUp
}
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
