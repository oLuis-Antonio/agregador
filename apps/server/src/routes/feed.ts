import { Hono } from "hono";
import { Feed, FeedType } from "@/types/schema";
import parseNews from "@/utils/parseNews";

type Env = {
  Bindings: {
    NEWS_DB_DEV: KVNamespace;
  };
};

const feed = new Hono<Env>();

feed.get("/", async (c) => {});

feed.post("/", async (c) => {
  let body: FeedType;

  try {
    body = Feed.parse(await c.req.json());
  } catch (error: any) {
    return c.json({ error: "Invalid format", details: error.errors }, 400);
  }

  const now = Date.now();
  const cutoff = now - 5 * 24 * 60 * 60 * 1000;

  const parsedItems = await parseNews(body, cutoff);

  console.log("parsedItems length:", parsedItems.length);

  const existingKeys = new Set(
    await c.env.NEWS_DB_DEV.list({ prefix: `news:${body.feedUrl}:` }).then(
      (r) => r.keys.map((k) => k.name)
    )
  );

  let saved = 0;

  for (const item of parsedItems) {
    if (!existingKeys.has(item.key)) {
      console.log(`Saving ${item.key}...`);
      await c.env.NEWS_DB_DEV.put(item.key, JSON.stringify(item.value));
      saved++;
    }
  }

  return c.json({
    status: "Success",
    received: parsedItems.length,
    saved,
  });
});

export default feed;
