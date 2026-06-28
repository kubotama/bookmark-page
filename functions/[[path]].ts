import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import type { D1Database } from '@cloudflare/workers-types'
import { API_PATH } from './constants/api'
import { BOOKMARKS } from './constants/sql'
import { API_MESSAGE, LOG_MESSAGE } from './constants/messages'
import { Bookmark } from './schemas/bookmark'

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
      BOOKMARKS.SELECT_ALL,
    ).all<Bookmark>()

    return c.json({
      success: true,
      data: results,
    })
  } catch (error) {
    console.error(LOG_MESSAGE.DB_ERROR(error))
    return c.json(
      {
        success: false,
        error: API_MESSAGE.FAILED_CONNECT_DATABASE,
      },
      500,
    )
  }
})

// Cloudflare Pagesのハンドラーとしてエクスポート
export const onRequest = handle(app)

export type AppType = typeof routes
