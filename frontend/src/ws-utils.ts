import { z } from "zod"
import * as wsModels from "./ws-models"

export function wsRequest(webSocket: WebSocket, request: wsModels.Request): Promise<wsModels.Response> {
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
                resolve(parsedResponse)
            }
        }
        webSocket.addEventListener("message", handleMessage)

        webSocket.addEventListener(
            "close",
            () => { reject("WebSocket closed") },
            { once: true }
        )

        webSocket.send(JSON.stringify(request))
    })
}
