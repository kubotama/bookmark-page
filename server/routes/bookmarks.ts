import { Hono } from 'hono'
import { db } from '../db'
import { bookmarksResponseSchema } from '../schemas/bookmark'

interface BookmarkRow {
  id: number
  title: string
  url: string
}

const bookmarksRoute = new Hono().get('/', (c) => {
  const stmt = db.prepare('SELECT bookmark_id as id, title, url FROM bookmarks')
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
})

export default bookmarksRoute
