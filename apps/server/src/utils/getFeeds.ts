import { ArticleType, Feed, FeedType } from "@/types/schema";
import Parser from "rss-parser";

const parser = new Parser({
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; MyRSSWorker/1.0)",
    Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
  },
  timeout: 10000,
});

export default async function getFeeds() {
  const feeds: { name: string; url: string }[] = JSON.parse(
    process.env.FEEDS || "[]"
  );

  await Promise.all(
    feeds.map(async (f) => {
      let success = false;
      const apiUrl = process.env.API;

      try {
        const feed = await parser.parseURL(f.url);
        await sendFeed(feed, f.url, apiUrl);
        console.log(`Status: feed ${f.url} parsed with success`);
        success = true;
      } catch (err) {
        console.warn(
          `Error: failed to parse feed ${f.url} with parseURL, will try fetch + parseString`,
          err
        );
      }

      if (!success) {
        try {
          const res = await fetch(f.url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; MyRSSWorker/1.0)",
              Accept: "application/rss+xml, application/xml;q=0.9,*/*;q=0.8",
            },
          });

          if (!res.ok) throw new Error(`Fetch returned status: ${res.status}`);

          const xml = await res.text();
          const feed = await parser.parseString(xml);
          await sendFeed(feed, f.url, apiUrl);

          console.log(`Status: feed ${f.url} parsed with success`);
        } catch (err) {
          console.error(`Error: failed to parse feed ${f.url}`, err);
        }
      }
    })
  );
}

async function sendFeed(feed, feedUrl: string, apiUrl) {
  try {
    if (!feed || !feed.items || feed.items.length === 0) {
      console.warn(`Feed inválido ou vazio, não será enviado: ${feed.feedUrl}`);
      return;
    }

    const normalizedItems = feed.items.map(normalizeItem);

    const payload: FeedType = {
      feedUrl: feedUrl,
      title: feed.title,
      description: feed.description || "",
      link: feed.link || "",
      items: normalizedItems,
    };

    const parsed = Feed.safeParse(payload);
    if (!parsed.success) {
      console.warn(`Feed inválido e não será enviado: ${feedUrl}`);
      return;
    }

    await fetch(`${apiUrl}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
  } catch (err) {
    console.error("Failed to write feed on server", err);
  }
}

function normalizeItem(item: ArticleType) {
  return {
    title: item.title || "Sem título",
    link: item.link || "",
    pubDate: item.pubDate || item["dc:date"] || Date.now(),
    content: item.content || item["content:encoded"] || "",
    contentSnippet: item.contentSnippet || item["content:encodedSnippet"] || "",
    creator: item.creator || item["dc:creator"] || "",
    categories: item.categories || [],
    guid: item.guid || item.link || "",
  };
}
