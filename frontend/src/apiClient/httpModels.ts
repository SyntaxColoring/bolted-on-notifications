// JSON shapes for HTTP requests and responses.

import { z } from "zod";

export const postButtonRequestSchema = z.object({});
export type PostButtonRequest = z.infer<typeof postButtonRequestSchema>;

export const getButtonResponseSchema = z.object({
  timesClicked: z.number(),
});
export type GetButtonResponse = z.infer<typeof getButtonResponseSchema>;

export const putMOTDRequestSchema = z.object({
  motd: z.string(),
});
export type PutMOTDRequest = z.infer<typeof putMOTDRequestSchema>;

export const getMOTDResponseSchema = z.object({
  motd: z.string(),
  lastModifiedAt: z.string(),
});
export type GetMOTDResponse = z.infer<typeof getMOTDResponseSchema>;
