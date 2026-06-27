import { Hono } from "hono"
import { handle } from "hono/cloudflare-pages"
import { TestBookmarks } from "./test/fixtures"

export const app = new Hono().basePath("/api") // APIのベースパスを /api に設定

// GET /api/bookmarks
app.get("/bookmarks", (c) => {
  return c.json({ success: true, data: TestBookmarks })
})

// Cloudflare Pagesのハンドラーとしてエクスポート
export const onRequest = handle(app)
