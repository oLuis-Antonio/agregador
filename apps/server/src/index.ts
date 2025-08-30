import { Hono } from "hono";
import { cors } from "hono/cors";
import feed from "@/routes/feed";
import getFeeds from "./utils/getFeeds";
import { Env } from "./types/schema";

const app = new Hono<{ Bindings: Env }>();

app.use(
  "/*",
  cors({
    origin: [process.env.ADRESS],
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
    await getFeeds(); // passe env explicitamente
  },
};
