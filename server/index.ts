import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

// フロントエンド(Vite:5173)からのアクセスを許可
app.use("/*", cors());

// APIルートの定義
const api = app.basePath("/api");

api.get("/hello", (c) => {
  return c.json({ message: "Hello from Hono!" });
});

const port = 3030;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
