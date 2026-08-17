import type { D1Database } from '@cloudflare/workers-types'

import { zValidator } from '@hono/zod-validator'
import { Context, Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { cors } from 'hono/cors'
import { uuidv7 } from 'uuidv7'

import { API_PATH } from '../../shared/constants/api'
import { ERROR_MESSAGE, UI_MESSAGES } from '../../shared/constants/uiMessages'
import { BOOKMARKS, DATABASE_NAME, KEYWORDS } from '../constants/db'
import { LOG_MESSAGE } from '../constants/logMessage'
import {
  Bookmark,
  BookmarkIdParamSchema,
  CreateBookmarkSchema,
  UpdateBookmarkSchema,
} from '../schemas/bookmark'
import { Keyword } from '../schemas/keyword'

type Env = {
  Bindings: {
    BOOKMARK_PAGE_DB: D1Database
  }
}

const handleDbError = (error: unknown, c: Context) => {
  // 💡 SQLite (D1) の UNIQUE 制約違反エラーを判定
  if (
    error instanceof Error &&
    error.message.includes('UNIQUE constraint failed')
  ) {
    return c.json(
      {
        error: UI_MESSAGES.API.DUPLICATE_URL,
        success: false,
      } as const,
      409,
    )
  }

  // 💡 それ以外の予期せぬデータベースエラー
  console.error(LOG_MESSAGE.DB_ERROR(error))
  return c.json(
    {
      error: UI_MESSAGES.API.DB_ERROR,
      success: false,
    } as const,
    500,
  )
}

export const app = new Hono<Env>().basePath(API_PATH.ROOT)

app.use(
  '*',
  cors({
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
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
        data: results,
        success: true,
      })
    } catch (error) {
      return handleDbError(error, c)
    }
  })
  .get(API_PATH.GET_KEYWORDS, async (c) => {
    try {
      const db = c.env.BOOKMARK_PAGE_DB
      if (!db) {
        throw new Error(ERROR_MESSAGE.DB_BINDING_ERROR(DATABASE_NAME))
      }

      // keywords テーブルから全キーワードを取得
      const { results } = await db.prepare(KEYWORDS.SELECT_ALL).all<Keyword>()

      return c.json({
        data: results,
        success: true,
      })
    } catch (error) {
      return handleDbError(error, c)
    }
  })
  .post(
    '/bookmarks',
    zValidator('json', CreateBookmarkSchema, (result, c) => {
      return !result.success
        ? c.json({ error: result.error.issues[0].message, success: false }, 400)
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
            data: newBookmark,
            success: true,
          } as const,
          201,
        )
      } catch (error) {
        return handleDbError(error, c)
      }
    },
  )

  .delete(
    API_PATH.DELETE_BOOKMARK,
    zValidator('param', BookmarkIdParamSchema, (result, c) => {
      return !result.success
        ? c.json({ error: result.error.issues[0].message, success: false }, 400)
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
        return handleDbError(error, c)
      }
    },
  )
  .patch(
    API_PATH.UPDATE_BOOKMARK,
    zValidator('param', BookmarkIdParamSchema, (result, c) => {
      return !result.success
        ? c.json({ error: result.error.issues[0].message, success: false }, 400)
        : undefined
    }),
    zValidator('json', UpdateBookmarkSchema, (result, c) => {
      return !result.success
        ? c.json({ error: result.error.issues[0].message, success: false }, 400)
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
              error: UI_MESSAGES.API.NOT_FOUND_BOOKMARK,
              success: false,
            } as const,
            404,
          )
        }
        return c.json({
          data: updatedBookmark,
          success: true,
        } as const)
      } catch (error) {
        return handleDbError(error, c)
      }
    },
  )

// Cloudflare Pagesのハンドラーとしてエクスポート
export const onRequest = handle(app)

export type AppType = typeof routes
