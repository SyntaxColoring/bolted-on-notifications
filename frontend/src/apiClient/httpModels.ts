// JSON shapes for HTTP requests and responses.

import { z } from "zod";

export type ButtonID = "red" | "green" | "blue" | "yellow";

export const postButtonRequestSchema = z.object({});
export type PostButtonRequest = z.infer<typeof postButtonRequestSchema>;

export const getButtonResponseSchema = z.object({
  timesClicked: z.number(),
});
export type GetButtonResponse = z.infer<typeof getButtonResponseSchema>;

export const putTextRequestSchema = z.object({
  text: z.string(),
});
export type PutTextRequest = z.infer<typeof putTextRequestSchema>;

export const getTextResponseSchema = z.object({
  text: z.string(),
  lastModifiedAt: z.string(),
});
export type GetTextResponse = z.infer<typeof getTextResponseSchema>;
