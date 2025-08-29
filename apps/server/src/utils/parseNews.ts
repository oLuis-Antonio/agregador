import { FeedType } from "@/types/schema";

export default function parseNews(feed: FeedType, cutoff: number) {
  return feed.items
    .map((article) => {
      const published = new Date(article.pubDate).getTime();
      if (published < cutoff) return null;

      return {
        key: `news:${feed.feedUrl}:${btoa(article.link)}`,
        value: {
          title: article.title,
          feed: feed.feedUrl,
          feedLink: feed.link,
          feedName: feed.title,
          pubDate: article.pubDate,
          link: article.link,
          creator: article.creator,
          contentSnippet: article.contentSnippet,
        },
      };
    })
    .filter(Boolean);
}
