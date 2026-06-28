import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import type { D1Database } from '@cloudflare/workers-types'
import { API_PATH } from './constants/api'

type Env = {
  Bindings: {
    BOOKMARK_PAGE_DB: D1Database
  }
}

export const app = new Hono<Env>().basePath(API_PATH.ROOT)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routes = app.get(API_PATH.GET_BOOKMARKS, async (c) => {
  try {
    const { results } = await c.env.BOOKMARK_PAGE_DB.prepare(
      'SELECT id, title, url FROM bookmarks ORDER BY created_at DESC',
    ).all()

    return c.json({
      success: true,
      data: results,
    })
  } catch (error) {
    console.error('DBエラー:', error)
    return c.json(
      {
        success: false,
        error: 'データベースの接続に失敗しました',
      },
      500,
    )
  }
})

// Cloudflare Pagesのハンドラーとしてエクスポート
export const onRequest = handle(app)

export type AppType = typeof routes
