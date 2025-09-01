import { Hono } from "hono";
import { ArticleType, Env } from "@/types/schema";
import parseNews from "@/utils/parseNews";

const feed = new Hono<{ Bindings: Env }>();

const INDEX_KEY = "index:latest";
const MAX_INDEX_SIZE = 1000;

feed.get("/", async (c) => {
  const kv = c.env.NEWS_DB;

  const pageSize = Number(c.req.query("limit") ?? 25); // article limit per request
  const cursor = c.req.query("cursor");

  const rawIndex = await kv.get(INDEX_KEY); // get stack of articles
  const index: string[] = rawIndex ? JSON.parse(rawIndex) : [];

  let startIndex = 0;
  if (cursor) {
    const foundIndex = index.findIndex((key) => key.includes(cursor));
    if (foundIndex >= 0) startIndex = foundIndex + 1;
  }
  const slice = index.slice(startIndex, startIndex + pageSize); // slice stack to get 25 news

  const items: ArticleType[] = await Promise.all(
    // get articles
    slice
      .map(async (key) => {
        const raw = await kv.get(key);
        return raw ? JSON.parse(raw) : null;
      })
      .filter(Boolean)
  );

  const nextCursor = items[items.length - 1]?.link ?? null;

  return c.json({
    status: "success",
    count: items.length,
    items: items,
    nextCursor,
  });

  // const items: ArticleType[] = await Promise.all(
  //   list.keys.map(async (k) => {
  //     const value = await kv.get(k.name);
  //     return value ? JSON.parse(value) : null;
  //   })
  // );

  // const sortedItems = items
  //   .filter(Boolean)
  //   .sort((a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate));

  // let startIndex = 0;
  // if (cursor) {
  //   const foundIndex = sortedItems.findIndex((item) => item.link === cursor);
  //   if (foundIndex >= 0) startIndex = foundIndex + 1;
  // }

  // const pageItems = sortedItems.slice(startIndex, startIndex + pageSize);
  // const nextCursor = pageItems[pageItems.length - 1]?.link ?? null;

  // return c.json({
  //   status: "success",
  //   count: pageItems.length,
  //   items: pageItems,
  //   nextCursor,
  // });
});

feed.post("/", async (c) => {
  const body = await c.req.json();
  const kv = c.env.NEWS_DB;
  const now = Date.now();
  const cutoff = now - 24 * 60 * 60 * 1000;

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

    const rawIndex = await kv.get(INDEX_KEY);
    let index: string[] = rawIndex ? JSON.parse(rawIndex) : [];

    for (const item of parsedItems) {
      const exists = await kv.get(item.key);
      if (!exists) {
        const pubTime = new Date(item.value.pubDate).getTime();
        const ttlSeconds = Math.max(
          0,
          Math.floor((pubTime + 24 * 60 * 60 * 1000 - now) / 1000)
        );

        await kv.put(item.key, JSON.stringify(item.value), {
          expirationTtl: ttlSeconds,
        });
        saved++;
        console.log(`salvo: ${item.value.link}`);

        index.unshift(item.key);
      } else {
        console.log(`duplicado: ${item.value.link}, ${item.key}`);
      }
    }

    index = index.slice(0, MAX_INDEX_SIZE);
    await kv.put(INDEX_KEY, JSON.stringify(index));

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
