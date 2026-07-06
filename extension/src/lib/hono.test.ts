import { describe, it, expect, beforeEach, vi } from 'vitest'
import { client } from './hono'
import { STORAGE_KEY } from '../constants/storage'
import { TEST_API_URL } from '../../../functions/test/fixtures'
import { DEFAULT_API_URL } from '../../../functions/constants/api'

describe('Hono RPC Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('client が正常に初期化されていること', () => {
    expect(client).toBeDefined()
    expect(client.api.bookmarks).toBeDefined()
    expect(typeof client.api.bookmarks.$post).toBe('function')
  })

  it.each([
    {
      name: 'ストレージに API URL が保存されていない場合',
      apiUrl: undefined,
      expectedApiUrl: DEFAULT_API_URL,
    },
    {
      name: 'ストレージに API URL が保存されている場合',
      apiUrl: TEST_API_URL.LOCAL,
      expectedApiUrl: TEST_API_URL.LOCAL,
    },
  ])(`$name`, async ({ apiUrl, expectedApiUrl }) => {
    // 1. ストレージのモック（保存されたURLを返すように設定）
    vi.spyOn(chrome.storage.local, 'get').mockImplementation(async () => ({
      [STORAGE_KEY.API_URL]: apiUrl,
    }))

    // 2. グローバル fetch のスパイ化（実際のネットワーク通信を防ぎ、ダミーレスポンスを返す）
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ success: true })))

    // 3. クライアント経由で通信を実行
    await client.api.bookmarks.$get()

    // 4. 呼び出された URL がカスタム URL に差し替わっているかを検証
    expect(fetchSpy).toHaveBeenCalledWith(
      `${expectedApiUrl}/api/bookmarks`,
      expect.any(Object),
    )
  })
})
