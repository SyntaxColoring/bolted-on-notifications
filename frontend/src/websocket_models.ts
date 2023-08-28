import { z } from "zod"

export const requestSchema = z.object({
    requestID: z.string(),
})

export const responseSchema = z.object({
    requestID: z.string(),
})

export const subscribeRequestSchema = requestSchema.extend({
    messageType: z.literal("subscribeRequest"),
    urlPath: z.array(z.string()),
})

export const subscribeResponseSchema = responseSchema.extend({
    messageType: z.literal("subscribeResponse"),
    subscriptionID: z.string(),
})

export const subscriptionNotificationSchema = z.object({
    messageType: z.literal("subscriptionNotification"),
    subscriptionID: z.string(),
})

export const getAllPostsSchema = z.object({
    data: z.array(z.object({
        id: z.string(),
        title: z.string(),
    }))
})
