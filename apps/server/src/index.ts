import { Hono } from "hono";
import { cors } from "hono/cors";
import feed from "@/routes/feed";
import getNews from "./scripts/getNews";

const app = new Hono().basePath("/api");

app.use(
  "/*",
  cors({
    origin: ["http://localhost"],
    allowHeaders: ["X-Custom-Header", "Upgrade-Insecure-Requests"],
    allowMethods: ["GET", "OPTIONS"],
    maxAge: 3600,
  })
);

app.get("/", (c) => {
  return c.json({
    status: "ok",
    time: new Date().toISOString(),
  });
});

app.route("/feed", feed);

export default {
  fetch: app.fetch,
  scheduled: async (event: ScheduledEvent, context: ExecutionContext) => {
    await getNews();
  },
};
