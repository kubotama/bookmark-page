import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { db } from '../db'
import {
  bookmarksResponseSchema,
  createBookmarkSchema,
  type BookmarkId,
} from '@shared/schemas/bookmark'
import { ERROR_MESSAGES, LOG_MESSAGES } from '@shared/constants'

interface BookmarkRow {
  id: number
  title: string
  url: string
}

const bookmarksRoute = new Hono()
  .get('/', (c) => {
    try {
      const stmt = db.prepare(
        'SELECT bookmark_id as id, title, url FROM bookmarks',
      )
      const rows = stmt.all() as BookmarkRow[]

      // DB のデータを API レスポンスの形式に整形
      const bookmarks = rows.map((row) => ({
        id: String(row.id) as BookmarkId,
        title: row.title,
        url: row.url,
      }))

      // Zod でバリデーション (柔軟なレスポンス構造)
      const result = bookmarksResponseSchema.parse({ bookmarks })

      return c.json(result)
    } catch (error) {
      console.error(LOG_MESSAGES.FETCH_BOOKMARKS_FAILED, error)
      return c.json(
        {
          message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        },
        500,
      )
    }
  })
  .post('/', zValidator('json', createBookmarkSchema), (c) => {
    const { title, url } = c.req.valid('json')

    try {
      const stmt = db.prepare(
        'INSERT INTO bookmarks (title, url) VALUES (?, ?) RETURNING bookmark_id as id, title, url',
      )
      const row = stmt.get(title, url) as BookmarkRow

      return c.json(
        {
          id: String(row.id) as BookmarkId,
          title: row.title,
          url: row.url,
        },
        201,
      )
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'SQLITE_CONSTRAINT_UNIQUE'
      ) {
        return c.json(
          {
            message: ERROR_MESSAGES.DUPLICATE_URL,
          },
          409,
        )
      }

      console.error(LOG_MESSAGES.CREATE_BOOKMARK_FAILED, error)
      return c.json(
        {
          message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        },
        500,
      )
    }
  })

export default bookmarksRoute
