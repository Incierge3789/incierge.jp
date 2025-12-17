import { defineCollection, z } from "astro:content";

export const collections = {
  insights: defineCollection({
    type: "content",
    schema: z.object({
      title: z.string(),
      description: z.string(),
      // ここを Date も受けられるように（文字列でも日付でもOK）
      date: z.coerce.date(),   // ← 変更点
      author: z.string().default("INCIERGE"),
      tags: z.array(z.string()).default([]),
      ogImage: z.string().optional(),
      disableUnifiedCta: z.boolean().optional(),
    }),
  }),
};
