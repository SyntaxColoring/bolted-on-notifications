import ReconnectingWebSocket from "reconnecting-websocket";
import { z } from "zod"
import * as wsModels from "./ws-models"


export function wsRequest(webSocket: ReconnectingWebSocket, request: wsModels.Request): Promise<wsModels.AnyFromServer> {
    return new Promise((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
            let parsedResponse;
            try {
                parsedResponse = wsModels.responseSchema.parse(JSON.parse(event.data))
            }
            catch {
                return // Ignore messages that don't parse as a response.
            }
            if (parsedResponse.requestID === request.requestID) {
                webSocket.removeEventListener("message", handleMessage)
                // TODO: Find a better way to do this.
                // We need to parse redundantly to AnyFromServer because when we just parse as
                // Response, Zod throws away response-specific keys like subscriptionID.
                resolve(wsModels.anyFromServerSchema.parse(JSON.parse(event.data)))
            }
        }
        webSocket.addEventListener("message", handleMessage)

        const handleClose = () => {
            reject("WebSocket closed")
            // ReconnectingWebSockets can emit close events multiple times.
            webSocket.removeEventListener("close", handleClose)
        }
        webSocket.addEventListener("close", handleClose)

        webSocket.send(JSON.stringify(request))
    })
}
