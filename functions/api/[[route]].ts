import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'

import { handle } from 'hono/cloudflare-pages'
import type { D1Database } from '@cloudflare/workers-types'
import { API_PATH } from '../../shared/constants/api'
import { BOOKMARKS, DATABASE_NAME } from '../constants/db'
import { ERROR_MESSAGE, UI_MESSAGES } from '../../shared/constants/uiMessages'
import {
  Bookmark,
  BookmarkIdParamSchema,
  CreateBookmarkSchema,
  UpdateBookmarkSchema,
} from '../schemas/bookmark'
import { uuidv7 } from 'uuidv7'
import { cors } from 'hono/cors'
import { LOG_MESSAGE } from '../constants/logMessage'

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
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
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
          error: UI_MESSAGES.API.FAILED_CONNECT_DATABASE,
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
            error: UI_MESSAGES.API.DB_ERROR,
          } as const,
          500,
        )
      }
    },
  )

  .delete(
    API_PATH.DELETE_BOOKMARK,
    zValidator('param', BookmarkIdParamSchema, (result, c) => {
      return !result.success
        ? c.json({ success: false, error: result.error.issues[0].message }, 400)
        : undefined
    }),
    async (c) => {
      // 💡 バリデーション済みの安全なパラメータを取得
      const { id } = c.req.valid('param')

      try {
        const db = c.env.BOOKMARK_PAGE_DB
        if (!db) {
          throw new Error(ERROR_MESSAGE.DB_BINDING_ERROR(DATABASE_NAME))
        }

        const { success } = await db.prepare(BOOKMARKS.DELETE).bind(id).run()

        if (!success) {
          throw new Error(ERROR_MESSAGE.FAILED_DELETE_BOOKMARK)
        }

        return c.body(null, 204)
      } catch (error) {
        console.error(LOG_MESSAGE.DB_ERROR(error))
        return c.json(
          {
            success: false,
            error: UI_MESSAGES.API.DB_ERROR,
          } as const,
          500,
        )
      }
    },
  )
  .patch(
    API_PATH.UPDATE_BOOKMARK,
    zValidator('param', BookmarkIdParamSchema, (result, c) => {
      return !result.success
        ? c.json({ success: false, error: result.error.issues[0].message }, 400)
        : undefined
    }),
    zValidator('json', UpdateBookmarkSchema, (result, c) => {
      return !result.success
        ? c.json({ success: false, error: result.error.issues[0].message }, 400)
        : undefined
    }),
    async (c) => {
      const { id } = c.req.valid('param')
      const updates = c.req.valid('json')

      try {
        const db = c.env.BOOKMARK_PAGE_DB
        if (!db) {
          throw new Error(ERROR_MESSAGE.DB_BINDING_ERROR(DATABASE_NAME))
        }

        const updatedBookmark = await db
          .prepare(BOOKMARKS.UPDATE)
          .bind(updates.title, updates.url, id)
          .first<Bookmark>()
        if (!updatedBookmark) {
          return c.json(
            {
              success: false,
              error: UI_MESSAGES.API.NOT_FOUND_BOOKMARK,
            } as const,
            404,
          )
        }
        return c.json({
          success: true,
          data: updatedBookmark,
        } as const)
      } catch (error) {
        console.error(LOG_MESSAGE.DB_ERROR(error))
        return c.json(
          {
            success: false,
            error: UI_MESSAGES.API.DB_ERROR,
          } as const,
          500,
        )
      }
    },
  )

// Cloudflare Pagesのハンドラーとしてエクスポート
export const onRequest = handle(app)

export type AppType = typeof routes
