import { hc } from 'hono/client'
// 💡 バックエンド（functions）のエントリーポイントから型定義（AppType）のみをインポート
import type { AppType } from '../../../functions/api/[[route]]'

// Hono の開発サーバー（Wrangler）の URL を指定
const BASE_URL = 'http://localhost:8788'

// 型安全な RPC クライアントを生成してエクスポート
export const client = hc<AppType>(BASE_URL)
