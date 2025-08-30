import { Hono } from "hono";
import { ArticleType, Env, Feed, FeedType } from "@/types/schema";
import parseNews from "@/utils/parseNews";

const feed = new Hono<{ Bindings: Env }>();

feed.get("/", async (c) => {
  const kv = c.env.NEWS_DB;

  const pageSize = Number(c.req.query("limit") ?? 25);
  const cursor = c.req.query("cursor");

  const list = await kv.list({ prefix: "news:" });

  const items: ArticleType[] = await Promise.all(
    list.keys.map(async (k) => {
      const value = await kv.get(k.name);
      return value ? JSON.parse(value) : null;
    })
  );

  const sortedItems = items
    .filter(Boolean)
    .sort((a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate));

  let startIndex = 0;
  if (cursor) {
    const foundIndex = sortedItems.findIndex((item) => item.link === cursor);
    if (foundIndex >= 0) startIndex = foundIndex + 1;
  }

  const pageItems = sortedItems.slice(startIndex, startIndex + pageSize);
  const nextCursor = pageItems[pageItems.length - 1]?.link ?? null;

  return c.json({
    status: "success",
    count: pageItems.length,
    items: pageItems,
    nextCursor,
  });
});

feed.post("/", async (c) => {
  let body: FeedType;
  const kv = c.env.NEWS_DB;
  const now = Date.now();
  const cutoff = now - 24 * 60 * 60 * 1000;

  try {
    body = Feed.parse(await c.req.json()); // validação do body
  } catch (error: any) {
    return c.json({ error: "Invalid format", details: error.errors }, 400);
  }

  // Rate Limiting

  const feedLockKey = `lock:${body.feedUrl}`;
  const lockTTL = 60;
  const maxRetries = 5;
  const retryDelay = 100; // ms

  let lockAcquired = false;

  for (let i = 0; i < maxRetries; i++) {
    const lockExists = await kv.get(feedLockKey);
    if (!lockExists) {
      await kv.put(feedLockKey, "1", { expirationTtl: lockTTL });
      lockAcquired = true;
      break;
    }
    await new Promise((res) => setTimeout(res, retryDelay));
  }

  if (!lockAcquired) {
    return c.json(
      { status: "locked", message: "This feed is already being processed." },
      429
    );
  }

  try {
    const parsedItems = await parseNews(body, cutoff);
    console.log("parsedItems length:", parsedItems.length);

    let saved = 0;

    for (const item of parsedItems) {
      const exists = await kv.get(item.key);
      if (!exists) {
        await kv.put(item.key, JSON.stringify(item.value));
        saved++;
        console.log(`salvo: ${item.value.link}`);
      } else {
        console.log(`duplicado: ${item.value.link}, ${item.key}`);
      }
    }

    return c.json({
      status: "success",
      received: parsedItems.length,
      itemsSaved: saved,
    });
  } finally {
    await kv.delete(feedLockKey);
  }
});

export default feed;
