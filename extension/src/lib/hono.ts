import { hc } from 'hono/client'

// バックエンド（functions）のエントリーポイントから型定義（AppType）のみをインポート
import type { AppType } from '../../../functions/api/[[route]]'

import { BookmarkUrlSchema } from '../../../functions/schemas/bookmark'
import { TIMEOUT_MILLISECOND } from '../../../shared/constants/api'

interface ClientOptions {
  apiUrl: string
  /** タイムアウト時間（ミリ秒）。デフォルト: 5000ms */
  timeoutMs?: number
}

export const createClient = (clientOptions: ClientOptions) => {
  const validUrl = BookmarkUrlSchema.parse(clientOptions.apiUrl)
  const timeoutMs = clientOptions.timeoutMs ?? TIMEOUT_MILLISECOND

  return hc<AppType>(validUrl, {
    fetch: (input: RequestInfo | URL, init?: RequestInit) => {
      const timeoutSignal = AbortSignal.timeout(timeoutMs)

      // 呼び出し元の signal と タイムアウト signal を合成
      const combinedSignal = init?.signal
        ? AbortSignal.any([init.signal, timeoutSignal])
        : timeoutSignal

      return fetch(input, {
        ...init,
        credentials: 'include',
        signal: combinedSignal,
      })
    },
  })
}
