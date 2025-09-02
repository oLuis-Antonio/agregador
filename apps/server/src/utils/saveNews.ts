import { Feed, FeedType } from "@/types/schema";
import parseNews from "@/utils/parseNews";

export const INDEX_KEY = "index:latest";
export const MAX_INDEX_SIZE = 1000;

export default async function saveNews(feed: FeedType, kv: KVNamespace) {
  const now = Date.now();
  // const cutoff = now - 24 * 60 * 60 * 1000;

  const parsed = Feed.safeParse(feed);
  if (!parsed.success) {
    console.warn(`Invalid feed: ${feed.feedUrl}`);
    return;
  }

  const parsedItems = await parseNews(feed);

  const rawIndex = await kv.get(INDEX_KEY);
  let index: Array<{ key: string; pubDate: number; link: string }> = rawIndex
    ? JSON.parse(rawIndex)
    : [];

  let saved = 0;

  for (const item of parsedItems) {
    const exists = await kv.get(item.key);
    if (!exists) {
      const pubTime = new Date(item.value.pubDate).getTime();
      const ttlSeconds = Math.max(
        60,
        Math.floor((pubTime + 24 * 60 * 60 * 1000 - now) / 1000)
      );

      await kv.put(item.key, JSON.stringify(item.value), {
        expirationTtl: ttlSeconds,
      });
      saved++;

      if (!index.find((i) => i.key === item.key)) {
        index.push({ key: item.key, pubDate: pubTime, link: item.value.link });
      }
    }
  }

  console.log(
    `[saveNews] feed=${feed.feedUrl}, parsed=${parsedItems.length}, saved=${saved}, indexSize=${index.length}`
  );

  index = index.slice(0, MAX_INDEX_SIZE);
  await kv.put(INDEX_KEY, JSON.stringify(index));

  return { saved, total: parsedItems.length };
}
