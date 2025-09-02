import { FeedType } from "@/types/schema";

export default function parseNews(feed: FeedType, cutoff: number) {
  return feed.items
    .map((article) => {
      const published = parseDate(article.pubDate);
      const key = `news:${feed.feedUrl}:${btoa(article.link)}`;

      // console.log(`parsing ${article.link} at parseNews`);

      if (published < cutoff) return null;

      return {
        key: key,
        value: {
          title: article.title || "Sem título",
          feed: feed.feedUrl,
          feedLink: feed.link || "",
          feedName: feed.title || "",
          pubDate: parseDate(
            article.pubDate || article["dc:date"] || Date.now()
          ),
          link: article.link || "",
          creator: article.creator || article["dc:creator"] || "",
          categories: article.categories || [],
          contentSnippet:
            article.contentSnippet || article["content:encodedSnippet"] || "",
        },
      };
    })
    .filter(Boolean);
}

function parseDate(rawDate: string | undefined): number {
  if (!rawDate) return Date.now();

  const parsed = new Date(rawDate).getTime();
  return isNaN(parsed) ? Date.now() : parsed;
}
