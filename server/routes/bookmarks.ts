import { Hono } from 'hono'
import { db } from '../db'
import { bookmarksResponseSchema } from '@shared/schemas/bookmark'
import { ERROR_MESSAGES } from '@shared/constants'

interface BookmarkRow {
  id: number
  title: string
  url: string
}

const bookmarksRoute = new Hono().get('/', (c) => {
  try {
    const stmt = db.prepare(
      'SELECT bookmark_id as id, title, url FROM bookmarks',
    )
    const rows = stmt.all() as BookmarkRow[]

    // DB のデータを API レスポンスの形式に整形
    const bookmarks = rows.map((row) => ({
      id: String(row.id),
      title: row.title,
      url: row.url,
    }))

    // Zod でバリデーション (柔軟なレスポンス構造)
    const result = bookmarksResponseSchema.parse({ bookmarks })

    return c.json(result)
  } catch (error) {
    console.error('Failed to fetch bookmarks:', error)
    return c.json(
      {
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      },
      500,
    )
  }
})

export default bookmarksRoute
