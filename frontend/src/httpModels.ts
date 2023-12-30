import { z } from "zod";

export const putMOTDRequestSchema = z.object({
  motd: z.string(),
});
export type PutMOTDRequest = z.infer<typeof putMOTDRequestSchema>;

export const getMOTDResponseSchema = z.object({
  motd: z.string(),
  lastModifiedAt: z.string(),
});
export type GetMOTDResponse = z.infer<typeof getMOTDResponseSchema>;
