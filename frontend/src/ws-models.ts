import { z } from "zod"


export const requestSchema = z.object({
    requestID: z.string(),
})
export type Request = z.infer<typeof requestSchema>


export const responseSchema = z.object({
    requestID: z.string(),
})
export type Response = z.infer<typeof responseSchema>


export const subscribeRequestSchema = requestSchema.extend({
    messageType: z.literal("subscribeRequest"),
    urlPath: z.array(z.string()),
})
export type SubscribeRequest = z.infer<typeof subscribeRequestSchema>


export const unsubscribeRequestSchema = requestSchema.extend({
    messageType: z.literal("unsubscribeRequest"),
    subscriptionID: z.string(),
})
export type UnsubscribeRequest = z.infer<typeof unsubscribeRequestSchema>


export const subscribeResponseSchema = responseSchema.extend({
    messageType: z.literal("subscribeResponse"),
    subscriptionID: z.string(),
})
export type SubscribeResponse = z.infer<typeof subscribeResponseSchema>


export const subscriptionNotificationSchema = z.object({
    messageType: z.literal("subscriptionNotification"),
    subscriptionID: z.string(),
})
export type SubscriptionNotification = z.infer<typeof subscriptionNotificationSchema>


export const anyFromServerSchema = z.union([subscribeResponseSchema, subscriptionNotificationSchema])
export type AnyFromServer = z.infer<typeof anyFromServerSchema>
