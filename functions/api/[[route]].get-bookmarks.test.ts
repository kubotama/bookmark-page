import { describe, it, expect, vi } from 'vitest'
import { app } from './[[route]]' // 💡 exportしたappをインポート
import { TestBookmarks } from '../test/fixtures'
import { D1Database } from '@cloudflare/workers-types'
import { BOOKMARKS } from '../constants/sql'
import { API_MESSAGE, ERROR_MESSAGE, LOG_MESSAGE } from '../constants/string'

describe('Hono Backend API - app.request', () => {
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
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const dbError = new Error(ERROR_MESSAGE.DB_ERROR)

    const allSpy = vi.fn().mockRejectedValue(dbError)
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
    expect(consoleSpy).toHaveBeenCalledWith(LOG_MESSAGE.DB_ERROR(dbError))
  })

  it('存在しないパスにアクセスした場合は404になること', async () => {
    const res = await app.request('/api/unknown-route')
    expect(res.status).toBe(404)
  })
})
