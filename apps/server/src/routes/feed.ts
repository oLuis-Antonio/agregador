import { Hono } from "hono";
import { Env, Feed, FeedType } from "@/types/schema";
import parseNews from "@/utils/parseNews";

const feed = new Hono<{ Bindings: Env }>();

feed.get("/", async (c) => {});

feed.post("/", async (c) => {
  let body: FeedType;
  const kv = c.env.NEWS_DB_DEV ?? c.env.NEWS_DB;

  try {
    body = Feed.parse(await c.req.json());
  } catch (error: any) {
    return c.json({ error: "Invalid format", details: error.errors }, 400);
  }

  const now = Date.now();
  const cutoff = now - 24 * 60 * 60 * 1000;

  const parsedItems = await parseNews(body, cutoff);

  console.log("parsedItems length:", parsedItems.length);

  const existingKeys = new Set(
    await kv
      .list({ prefix: `news:${body.feedUrl}:` })
      .then((r) => r.keys.map((k) => k.name))
  );

  let saved = 0;

  for (const item of parsedItems) {
    if (!existingKeys.has(item.key)) {
      await c.env.NEWS_DB_DEV.put(item.key, JSON.stringify(item.value));
      saved++;
    }
  }

  return c.json({
    status: "Success",
    received: parsedItems.length,
    itemsSaved: saved,
  });
});

export default feed;
