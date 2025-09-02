import Parser from "rss-parser";
import saveNews from "./saveNews";

export const INDEX_KEY = "index:latest";
export const MAX_INDEX_SIZE = 1000;

const parser = new Parser({
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; MyRSSWorker/1.0)",
    Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
  },
  timeout: 10000,
});

export default async function getFeeds(kv: KVNamespace) {
  const feeds: { name: string; url: string }[] = JSON.parse(
    process.env.FEEDS || "[]"
  );

  for (const f of feeds) {
    try {
      let feed;
      try {
        feed = await parser.parseURL(f.url);
      } catch {
        const res = await fetch(f.url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; MyRSSWorker/1.0)",
            Accept: "application/rss+xml, application/xml;q=0.9,*/*;q=0.8",
          },
        });
        const xml = await res.text();

        feed = await parser.parseString(xml);
      }

      const normalizedFeed = {
        ...feed,
        feedUrl: feed.feedUrl ?? f.url,
        items: (feed.items ?? []).map((item) => ({
          title: item.title ?? "",
          link: item.link ?? "",
          pubDate: item.pubDate ?? item.date ?? "",
          creator: item.creator ?? item["dc:creator"] ?? "",
          content: item.content ?? item["content:encoded"] ?? "",
          contentSnippet:
            item.contentSnippet ?? item["content:encodedSnippet"] ?? "",
          guid: item.guid ?? item.link ?? "",
          categories: item.categories ?? [],
          isoDate: item.isoDate ?? item.date ?? "",
        })),
      };

      await saveNews(normalizedFeed, kv);
      console.log(`Status: feed ${f.url} parsed with success`);
    } catch (err) {
      console.error(`Error: failed to parse feed ${f.url}`, err);
    }
  }

  console.log("now, generating index...");

  await rebuildIndex(kv);
}

async function rebuildIndex(kv: KVNamespace) {
  const now = Date.now();
  const keys = await kv.list({ prefix: "news:" }); // lista todas as chaves
  let items: Array<{ key: string; pubDate: number; link: string }> = [];

  for (const key of keys.keys) {
    const raw = await kv.get(key.name);
    if (!raw) continue;
    const value = JSON.parse(raw);
    const pubTime = new Date(value.pubDate).getTime();
    if (pubTime + 24 * 60 * 60 * 1000 < now) continue; // TTL expirado
    items.push({ key: key.name, pubDate: pubTime, link: value.link });
  }
  items.sort((a, b) => b.pubDate - a.pubDate);

  items = items.slice(0, MAX_INDEX_SIZE);

  await kv.put(INDEX_KEY, JSON.stringify(items));
}
