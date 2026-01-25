import { Hono } from 'hono'
import { cors } from 'hono/cors'
import bookmarksRoute from './routes/bookmarks'

const app = new Hono()

// フロントエンド(Vite:5173)および Chrome 拡張機能からのアクセスを許可
app.use(
  '/*',
  cors({
    origin: (origin) => {
      const allowedOrigin =
        process.env.BOOKMARK_PAGE_FRONTEND_URL || 'http://localhost:5173'
      if (origin === allowedOrigin || origin.startsWith('chrome-extension://')) {
        return origin
      }
      return allowedOrigin
    },
  }),
)

// APIルートの定義

export const api = app.basePath('/api').route('/bookmarks', bookmarksRoute)

export type AppType = typeof api

export default app
