import { Hono } from "hono"
import { handle } from "hono/cloudflare-pages"

export const app = new Hono().basePath("/api") // APIのベースパスを /api に設定

// MVP用のダミーデータ
const dummyBookmarks = [
  { id: "1", title: "Hono", url: "https://hono.dev" },
  { id: "2", title: "Vite", url: "https://vitejs.dev" },
]

// GET /api/bookmarks
app.get("/bookmarks", (c) => {
  return c.json({ success: true, data: dummyBookmarks })
})

// Cloudflare Pagesのハンドラーとしてエクスポート
export const onRequest = handle(app)
