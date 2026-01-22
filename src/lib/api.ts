import { hc } from 'hono/client'
import type { AppType } from '../../server/app'

// Vite の開発サーバーのプロキシ設定（vite.config.ts）により、
// /api へのリクエストはバックエンドに転送されます。
export const client = hc<AppType>('/')
