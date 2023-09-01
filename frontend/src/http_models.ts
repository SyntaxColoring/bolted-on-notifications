import { z } from "zod"

export const allPostsSchema = z.object({
    data: z.array(z.object({
        id: z.string(),
        title: z.string(),
        body: z.string(),
    }))
})

export type AllPosts = z.infer<typeof allPostsSchema>;
