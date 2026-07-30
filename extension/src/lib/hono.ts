import { hc } from 'hono/client'

// バックエンド（functions）のエントリーポイントから型定義（AppType）のみをインポート
import type { AppType } from '../../../functions/api/[[route]]'

import { DEFAULT_API_URL } from '../../../shared/constants/api'
import { STORAGE_KEY } from '../../constants/storage'

// 型安全な RPC クライアントを生成してエクスポート
export const client = hc<AppType>(DEFAULT_API_URL, {
  fetch: async (input: RequestInfo | URL, init: RequestInit | undefined) => {
    const chrome = globalThis.chrome
    const apiUrl = chrome?.storage?.local
      ? (await chrome.storage.local.get([STORAGE_KEY.API_URL]))[
          STORAGE_KEY.API_URL
        ]
      : undefined

    if (apiUrl) {
      const urlStr = typeof input === 'string' ? input : input.toString()
      const newUrl = urlStr.replace(DEFAULT_API_URL, apiUrl)
      return fetch(newUrl, {
        ...init,
        credentials: 'include',
      })
    }

    return fetch(input, {
      ...init,
      credentials: 'include',
    })
  },
})
