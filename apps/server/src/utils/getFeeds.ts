import { FeedType } from "@/types/schema";
import Parser from "rss-parser";
import saveNews from "./saveNews";

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

  await Promise.all(
    feeds.map(async (f) => {
      let success = false;

      try {
        const feed: FeedType = await parser.parseURL(f.url);
        await saveNews(feed, kv);

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
          await saveNews(feed, kv);

          console.log(`Status: feed ${f.url} parsed with success`);
        } catch (err) {
          console.error(`Error: failed to parse feed ${f.url}`, err);
        }
      }
    })
  );
}
