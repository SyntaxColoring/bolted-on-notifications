// JSON shapes for Socket.IO events.

import { z } from "zod";

export interface ClientToServerEvents {
  subscribe: (
    data: SubscribeData,
    ack: (ackData: SubscribeAckData) => void,
  ) => void;
}

export const subscribeData = z.object({
  path: z.array(z.string()),
});
export type SubscribeData = z.infer<typeof subscribeData>;

export const subscribeAckData = z.object({});
export type SubscribeAckData = z.infer<typeof subscribeAckData>;

export interface ServerToClientEvents {
  notification: (data: NotificationData) => void;
}

export const notificationData = z.object({});
export type NotificationData = z.infer<typeof notificationData>;
