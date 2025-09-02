import { Hono } from "hono";
import { ArticleType, Env } from "@/types/schema";
import saveNews from "@/utils/saveNews";

const feed = new Hono<{ Bindings: Env }>();

const INDEX_KEY = "index:latest";

feed.get("/", async (c) => {
  const kv = c.env.NEWS_DB;

  const pageSize = Number(c.req.query("limit") ?? 25); // article limit per request
  const cursor = c.req.query("cursor") ?? null;

  const rawIndex = await kv.get(INDEX_KEY); // get stack of articles
  const index: Array<{ key: string; pubDate: number; link: string }> = rawIndex
    ? JSON.parse(rawIndex)
    : [];

  // const sortedIndex = index.sort((a, b) => b.pubDate - a.pubDate);

  let startIndex = 0;
  if (cursor) {
    const foundIndex = index.findIndex(
      (e) => e.key === cursor || e.link === cursor
    );
    if (foundIndex >= 0) startIndex = foundIndex + 1;
  }

  const pageSlice = index.slice(startIndex, startIndex + pageSize); // slice stack to get 25 news
  const keysForPage = pageSlice.map((e) => e.key); // articles to be fetched

  const items: ArticleType[] = await Promise.all(
    keysForPage
      .map(async (k) => {
        const raw = await kv.get(k);
        return raw ? JSON.parse(raw) : null;
      })
      .filter(Boolean)
  );

  const nextCursor = pageSlice.length
    ? pageSlice[pageSlice.length - 1].link
    : null;

  return c.json({
    status: "success",
    count: items.length,
    items,
    nextCursor,
    total: index.length,
  });
});

feed.post("/", async (c) => {
  const body = await c.req.json();
  const kv = c.env.NEWS_DB;

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
    const result = await saveNews(body, kv);
    return c.json({ status: "success", ...result });
  } finally {
    await kv.delete(feedLockKey);
  }
});

export default feed;
