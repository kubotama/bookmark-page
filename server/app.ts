import { Hono } from 'hono'
import { cors } from 'hono/cors'
import bookmarksRoute from './routes/bookmarks'

const app = new Hono()

// フロントエンド(Vite:5173)からのアクセスを許可
app.use(
  '/*',
  cors({
    origin: process.env.BOOKMARK_PAGE_FRONTEND_URL || 'http://localhost:5173',
  }),
)

// APIルートの定義

export const api = app.basePath('/api').route('/bookmarks', bookmarksRoute)

export type AppType = typeof api

export default app
