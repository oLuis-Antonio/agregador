import { Feed, FeedType } from "@/types/schema";
import parseNews from "@/utils/parseNews";

export default async function saveNews(feed: FeedType, kv: KVNamespace) {
  const now = Date.now();
  const cutoff = now - 24 * 60 * 60 * 1000;
  let saved = 0;

  const parsed = Feed.safeParse(feed);
  if (!parsed.success) {
    console.warn(`Invalid feed: ${feed.feedUrl}`);
    return;
  }
  const parsedItems = await parseNews(feed, cutoff);

  for (const item of parsedItems) {
    const exists = await kv.get(item.key);
    const pubTime = new Date(item.value.pubDate).getTime();
    if (!exists) {
      const ttlSeconds = Math.max(
        60,
        Math.floor((pubTime + 24 * 60 * 60 * 1000 - now) / 1000)
      );

      await kv.put(item.key, JSON.stringify(item.value), {
        expirationTtl: ttlSeconds,
      });
      saved++;
    }
  }

  console.log(
    `[saveNews] feed=${feed.feedUrl}, parsed=${parsedItems.length}, saved=${saved}`
  );

  return { saved, total: parsedItems.length };
}
