import { describe, it, expect, vi } from 'vitest'
import { app } from './[[path]]' // 💡 exportしたappをインポート
import { TestBookmarks } from './test/fixtures'
import { D1Database } from '@cloudflare/workers-types'

describe('Hono Backend API - app.request', () => {
  it('GET /api/bookmarks が正しいJSONを返すこと', async () => {
    const allSpy = vi.fn().mockResolvedValue({
      results: TestBookmarks,
    })
    const prepareSpy = vi.fn().mockReturnValue({ all: allSpy })

    const mockD1Database: Partial<D1Database> = {
      prepare: prepareSpy as D1Database['prepare'],
    }

    // 💡 2. Hono にモックを注入してリクエストを実行
    const res = await app.request(
      '/api/bookmarks',
      {},
      {
        BOOKMARK_PAGE_DB: mockD1Database as D1Database,
      },
    )
    // 💡 3. 【ここが肝】Honoの内部で prepare() に渡された「SQL文字列」を厳密にチェック！
    const expectedSQL =
      'SELECT id, title, url FROM bookmarks ORDER BY created_at DESC'

    expect(prepareSpy).toHaveBeenCalledWith(expectedSQL)
    expect(allSpy).toHaveBeenCalledOnce()
    expect(res.status).toBe(200)

    // レスポンスボディの検証
    const body = await res.json()
    expect(body).toEqual({
      success: true,
      data: TestBookmarks,
    })
  })

  it('存在しないパスにアクセスした場合は404になること', async () => {
    const res = await app.request('/api/unknown-route')
    expect(res.status).toBe(404)
  })
})
