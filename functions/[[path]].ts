import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'

import { handle } from 'hono/cloudflare-pages'
import type { D1Database } from '@cloudflare/workers-types'
import { API_PATH } from './constants/api'
import { BOOKMARKS } from './constants/sql'
import { API_MESSAGE, ERROR_MESSAGE, LOG_MESSAGE } from './constants/string'
import { Bookmark, CreateBookmarkSchema } from './schemas/bookmark'
import { uuidv7 } from 'uuidv7'
import { cors } from 'hono/cors'

const DATABASE_NAME = 'BOOKMARK_PAGE_DB'

type Env = {
  Bindings: {
    BOOKMARK_PAGE_DB: D1Database
  }
}

export const app = new Hono<Env>().basePath(API_PATH.ROOT)

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) {
        return undefined
      }
      if (origin.startsWith('chrome-extension://')) {
        return origin
      }
      try {
        const url = new URL(origin)
        const isLocalhost = url.hostname === 'localhost'
        const isPagesDev = url.hostname.endsWith('.pages.dev')
        if (isLocalhost || isPagesDev) {
          return origin
        }
      } catch {
        // ignore invalid URL
      }
      return undefined
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routes = app
  .get(API_PATH.GET_BOOKMARKS, async (c) => {
    try {
      const db = c.env.BOOKMARK_PAGE_DB
      if (!db) {
        throw new Error(ERROR_MESSAGE.DB_BINDING_ERROR(DATABASE_NAME))
      }
      const { results } = await db.prepare(BOOKMARKS.SELECT_ALL).all<Bookmark>()

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
        } as const,
        500,
      )
    }
  })
  .post(
    '/bookmarks',
    zValidator('json', CreateBookmarkSchema, (result, c) => {
      return !result.success
        ? c.json({ success: false, error: result.error.issues[0].message }, 400)
        : undefined
    }),
    async (c) => {
      const { title, url } = c.req.valid('json')
      const id = uuidv7()

      try {
        const db = c.env.BOOKMARK_PAGE_DB
        if (!db) {
          throw new Error(ERROR_MESSAGE.DB_BINDING_ERROR(DATABASE_NAME))
        }
        const newBookmark = await db
          .prepare(BOOKMARKS.INSERT)
          .bind(id, title, url)
          .first<Bookmark>()

        if (!newBookmark) {
          throw new Error(ERROR_MESSAGE.INSERT_BOOKMARK_ERROR)
        }

        return c.json(
          {
            success: true,
            data: newBookmark,
          } as const,
          201,
        )
      } catch (error) {
        console.error(LOG_MESSAGE.DB_ERROR(error))
        return c.json(
          {
            success: false,
            error: ERROR_MESSAGE.DB_ERROR,
          } as const,
          500,
        )
      }
    },
  )

// Cloudflare Pagesのハンドラーとしてエクスポート
export const onRequest = handle(app)

export type AppType = typeof routes
