import { describe, it, expect, vi } from 'vitest'
import { app } from './[[path]]' // 💡 exportしたappをインポート
import { TestBookmarks } from './test/fixtures'
import { D1Database } from '@cloudflare/workers-types'
import { BOOKMARKS } from './constants/sql'
import { API_MESSAGE, ERROR_MESSAGE } from './constants/messages'

describe('ブックマークの取得: GET /api/bookmarks', () => {
  it('GET /api/bookmarks が正しいJSONを返すこと', async () => {
    const allSpy = vi.fn().mockResolvedValue({
      results: TestBookmarks,
    })
    const prepareSpy = vi.fn().mockReturnValue({ all: allSpy })

    const mockD1Database: Partial<D1Database> = {
      prepare: prepareSpy as D1Database['prepare'],
    }

    const res = await app.request(
      '/api/bookmarks',
      {},
      {
        BOOKMARK_PAGE_DB: mockD1Database as D1Database,
      },
    )
    const expectedSQL = BOOKMARKS.SELECT_ALL

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

  it('GET /api/bookmarks - DB側で例外が発生した際、適切に500エラーを返すこと', async () => {
    const allSpy = vi.fn().mockRejectedValue(new Error(ERROR_MESSAGE.DB_ERROR))
    const prepareSpy = vi.fn().mockReturnValue({ all: allSpy })

    const mockFailedDb: Partial<D1Database> = {
      prepare: prepareSpy as D1Database['prepare'],
    }

    const res = await app.request(
      '/api/bookmarks',
      {},
      {
        BOOKMARK_PAGE_DB: mockFailedDb as D1Database,
      },
    )

    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json).toEqual({
      success: false,
      error: API_MESSAGE.FAILED_CONNECT_DATABASE,
    })
  })

  it('存在しないパスにアクセスした場合は404になること', async () => {
    const res = await app.request('/api/unknown-route')
    expect(res.status).toBe(404)
  })
})
