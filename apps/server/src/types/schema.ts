import * as z from "zod";

export const Article = z.object({
  title: z.string(),
  link: z.string(),
  pubDate: z.string(),
  creator: z.string().optional(),
  content: z.string().optional(),
  contentSnippet: z.string().optional(),
  guid: z.string().optional(),
  categories: z.array(z.string()).optional(),
  isoDate: z.string().optional(),
});

export const Feed = z.object({
  feedUrl: z.string(),
  title: z.string(),
  description: z.string().optional(),
  link: z.string().optional(),
  items: z.array(Article),
});
