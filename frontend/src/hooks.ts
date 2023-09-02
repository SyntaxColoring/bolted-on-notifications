import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BASE_URL } from './urls'
import ReconnectingWebSocket from 'reconnecting-websocket'
import { useEffect } from 'react'
import * as wsModels from './ws-models'
import { z } from "zod"
import { allPostsSchema, AllPosts } from './http_models'
import { wsRequest } from './ws-utils'

type SubscriptionRequest = z.infer<typeof wsModels.subscribeRequestSchema>;

export function usePosts(webSocket: WebSocket) {
    const queryClient = useQueryClient()
    const queryKey: string[] = ["posts"]

    useEffect(
        () => {
            const subscriptionRequest: wsModels.SubscribeRequest = {
                messageType: "subscribeRequest",
                requestID: generateID(),
                urlPath: queryKey,
            }
            console.log("Subscribing...")
            wsSubscribeRequest(webSocket as WebSocket, subscriptionRequest)
            .then((subscribeResponse) => {
                console.log("Subscribed!")
                webSocket.addEventListener("message", (event) => {
                    // TODO: Deduplicate with ws-utils?
                    let parsedResponse;
                    try {
                        parsedResponse = wsModels.subscriptionNotificationSchema.parse(JSON.parse(event.data))
                    }
                    catch {
                        return // Ignore messages that don't parse as a notification.
                    }
                    if (parsedResponse.subscriptionID === subscribeResponse.subscriptionID) {
                        console.log("It's a notification.")
                    }
                })
            })

            function cleanup() {
                console.log("Cleaning up.")
            }

            return cleanup
        },
        [webSocket]
    )

    return useQuery({
        queryKey: queryKey,
        queryFn: getPosts,
    })
}

async function requestResponseOnWebSocket() {
    // TODO: Take a websocket, a message, and an expected response type.
    // Ignore messages not in response to that message.
    // Clean up when WebSocket closes (in case it reopens), etc.
}

async function getPosts(): Promise<AllPosts> {
    const result = await fetch(`${BASE_URL}/posts`)
    if (!result.ok) throw Error("Fetch result not OK.")
    return allPostsSchema.parse(await result.json())
}

function generateID(): string {
    return Date.now().toString() // FIXME
}

async function wsSubscribeRequest(webSocket: WebSocket, request: wsModels.SubscribeRequest): Promise<wsModels.SubscribeResponse> {
    const response = await wsRequest(webSocket, request)
    const subscribeResponse = wsModels.subscribeResponseSchema.parse(response)
    return subscribeResponse
}
