import { Hono } from "hono";

const feed = new Hono();

feed.get("/", (c) => {
  return c.text("feed");
});

export default feed;
