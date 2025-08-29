import Parser from "rss-parser";

const parser = new Parser();

export default async function getFeeds() {
  const feeds = [
    {
      name: "Jornal O Futuro",
      url: "https://oluis-antonio.github.io/feed-jornalofuturo/feed.xml",
    },
  ];

  await Promise.all(
    feeds.map(async (f) => {
      try {
        const feed = await parser.parseURL(f.url);
        await fetch("http://localhost:8787/api/feed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(feed),
        });
      } catch (err) {
        console.error("Error: failed to parse feed", f.url, err);
      }
    })
  );
}
