import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { TestBookmarks } from './test/fixtures'
import { API_PATH } from './constants/api'

export const app = new Hono().basePath(API_PATH.ROOT) // APIのベースパスを /api に設定

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routes = app.get(API_PATH.GET_BOOKMARKS, (c) => {
  return c.json({ success: true, data: TestBookmarks })
})

// Cloudflare Pagesのハンドラーとしてエクスポート
export const onRequest = handle(app)

export type AppType = typeof routes
