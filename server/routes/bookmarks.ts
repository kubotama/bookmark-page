import { Hono } from 'hono'
import { z } from 'zod'

import { zValidator } from '@hono/zod-validator'
import { ERROR_MESSAGES, LOG_MESSAGES, HTTP_STATUS } from '@shared/constants'
import {
  BookmarkIdSchema,
  bookmarkRowSchema,
  bookmarksResponseSchema,
  createBookmarkSchema,
} from '@shared/schemas/bookmark'

import { db } from '../db'

function isSqliteError(error: unknown): error is Error & { code: string } {
  return error instanceof Error && 'code' in error
}

const bookmarksRoute = new Hono()
  .get('/', (c) => {
    try {
      const stmt = db.prepare(
        'SELECT bookmark_id as id, title, url FROM bookmarks',
      )
      const rows = z.array(bookmarkRowSchema).parse(stmt.all())

      // DB のデータを API レスポンスの形式に整形
      const bookmarks = rows.map((row) => ({
        id: BookmarkIdSchema.parse(String(row.id)),
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
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      )
    }
  })
  .post('/', zValidator('json', createBookmarkSchema), (c) => {
    const { title, url } = c.req.valid('json')

    try {
      const stmt = db.prepare(
        'INSERT INTO bookmarks (title, url) VALUES (?, ?) RETURNING bookmark_id as id, title, url',
      )
      const row = bookmarkRowSchema.parse(stmt.get(title, url))

      return c.json(
        {
          id: BookmarkIdSchema.parse(String(row.id)),
          title: row.title,
          url: row.url,
        },
        HTTP_STATUS.CREATED,
      )
    } catch (error) {
      if (isSqliteError(error) && error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return c.json(
          {
            message: ERROR_MESSAGES.DUPLICATE_URL,
          },
          HTTP_STATUS.CONFLICT,
        )
      }

      console.error(LOG_MESSAGES.CREATE_BOOKMARK_FAILED, error)
      return c.json(
        {
          message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        },
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      )
    }
  })
  .delete('/:id', zValidator('param', z.object({ id: BookmarkIdSchema })), (c) => {
    const { id } = c.req.valid('param')

    try {
      const info = db.prepare('DELETE FROM bookmarks WHERE bookmark_id = ?').run(id)

      if (info.changes === 0) {
        return c.json(
          {
            message: ERROR_MESSAGES.BOOKMARK_NOT_FOUND,
          },
          HTTP_STATUS.NOT_FOUND,
        )
      }

      return c.body(null, HTTP_STATUS.NO_CONTENT)
    } catch (error) {
      console.error(LOG_MESSAGES.DELETE_BOOKMARK_FAILED, error)
      return c.json(
        {
          message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        },
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      )
    }
  })

export default bookmarksRoute
