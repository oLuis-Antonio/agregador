import Parser from "rss-parser";

const parser = new Parser();

export default async function getNews() {
  const feeds = ["https://oluis-antonio.github.io/feed-jornalofuturo/feed.xml"];

  await Promise.all(
    feeds.map(async (url) => {
      try {
        const feed = await parser.parseURL(url);
        await fetch("localhost:8787/api/feed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(feed),
        });
      } catch (err) {
        console.error("Error: failed to parse feed", url, err);
      }
    })
  );
}
