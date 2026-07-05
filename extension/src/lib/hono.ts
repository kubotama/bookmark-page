import { hc } from 'hono/client'
// バックエンド（functions）のエントリーポイントから型定義（AppType）のみをインポート
import type { AppType } from '../../../functions/api/[[route]]'

// フォールバック用のデフォルトURL（未設定時の挙動対策）
const DEFAULT_URL = 'http://localhost:8788'

// 型安全な RPC クライアントを生成してエクスポート
export const client = hc<AppType>(DEFAULT_URL, {
  // すべての $get や $post などの通信が発生する直前にこの fetch が割り込みます
  fetch: async (input: URL | RequestInfo, init: RequestInit | undefined) => {
    // 1. chrome.storage.local からユーザーが保存した URL を取得
    const { apiUrl } = await chrome.storage.local.get(['apiUrl'])

    // 2. 保存された URL があれば、リクエスト先を差し替える
    if (apiUrl && typeof input === 'string') {
      // 元の input（例: "http://localhost:8788/api/bookmarks"）から
      // ベースURL部分を、ユーザーが設定した URL に置換します
      const newUrl = input.replace(DEFAULT_URL, apiUrl)
      return fetch(newUrl, init)
    }

    // 3. ストレージに無ければデフォルト（localhost）で通信
    return fetch(input, init)
  },
})
