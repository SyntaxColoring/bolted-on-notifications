import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BASE_URL } from './urls'
import ReconnectingWebSocket from 'reconnecting-websocket'
import { useEffect } from 'react'
import * as wsModels from './ws-models'
import { z } from "zod"
import { allPostsSchema, AllPosts } from './http_models'
import { wsRequest } from './ws-utils'

type SubscriptionRequest = z.infer<typeof wsModels.subscribeRequestSchema>;

export function usePosts(webSocket: ReconnectingWebSocket) {
    const queryClient = useQueryClient()
    const queryKey: string[] = []

    useEffect(
        () => {
            const subscriptionRequestID = generateID()

            let subscriptionID: null | string = null

            function openSubscription() {
                const subscriptionRequest: SubscriptionRequest = {
                    messageType: "subscribeRequest",
                    requestID: subscriptionRequestID,
                    urlPath: ["posts"],
                }
                webSocket.send(JSON.stringify(subscriptionRequest))
                console.log("Opening subscription.")
            }

            function closeSubscription() {
                console.log("Closing subscription.")
            }

            function handleMessage(event: MessageEvent) {
                const jsonData = JSON.parse(event.data)
                console.log("Got data:", jsonData)
                const asSubscribeResponse = wsModels.subscribeResponseSchema.safeParse(jsonData)
                const asNotification = wsModels.subscriptionNotificationSchema.safeParse(jsonData)

                if (asSubscribeResponse.success) {
                    const data = asSubscribeResponse.data
                    if (data.requestID === subscriptionRequestID) {
                        subscriptionID = data.subscriptionID
                        // TODO: Set ready.
                        console.log("Subscribed!")
                    }
                }

                if (asNotification.success) {
                    const data = asNotification.data
                    if (data.subscriptionID === subscriptionID) {
                        console.log("Received notification!")
                        queryClient.invalidateQueries({queryKey})
                    }
                }
            }

            webSocket.addEventListener("message", handleMessage)
            webSocket.addEventListener("open", openSubscription)
            if (webSocket.readyState == WebSocket.OPEN) {
                openSubscription()
            }

            function cleanup() {
                console.log("Cleaning up.")
                webSocket.removeEventListener("open", openSubscription)
                webSocket.removeEventListener("message", handleMessage)
                closeSubscription()
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
