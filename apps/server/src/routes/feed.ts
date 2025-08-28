import { Hono } from "hono";
import { Feed } from "@/types/schema";

const feed = new Hono();

feed.get("/", async (c) => {});

feed.post("/", async (c) => {
  let body;

  try {
    body = Feed.parse(await c.req.json());
  } catch (error) {
    return c.json({ error: "Invalid format", details: error.errors }, 400);
  }

  const now = Date.now();
  const cutoff = now - 5 * 24 * 60 * 60 * 1000;
  const ttlLimit = 5 * 24 * 60 * 60;

  await Promise.all(
    body.items.map(async (article) => {
      const published = new Date(article.pubDate).getTime();

      if (published < cutoff) return;

      const key = btoa(article.link);

      const value = JSON.stringify({
        title: article.title,
        feed: body.feedUrl,
        date: article.pubDate,
        link: article.link,
        creator: article.creator,
        contentSnippet: article.contentSnippet,
      });
    })
  );
});

export default feed;
