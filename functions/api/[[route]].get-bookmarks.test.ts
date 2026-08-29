import { D1Database } from '@cloudflare/workers-types'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'

import { ERROR_MESSAGE, UI_MESSAGES } from '../../shared/constants/uiMessages'
import { BOOKMARKS, DATABASE_NAME } from '../constants/db'
import { LOG_MESSAGE } from '../constants/logMessage'
import {
  REQUEST_API_PATH,
  TEST_ERROR_MESSAGE,
  TestBookmarkWithKeywords,
  TestBookmarkWKWTableData,
} from '../test/fixtures'
import { app } from './[[route]]' // 💡 exportしたappをインポート

describe('Hono Backend API - app.request', () => {
  let consoleSpy: Mock<(...data: unknown[]) => void>
  beforeEach(() => {
    vi.resetAllMocks()
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('GET /api/bookmarks が正しいJSONを返すこと', async () => {
    const allSpy = vi.fn().mockResolvedValue({
      results: TestBookmarkWKWTableData,
    })
    const prepareSpy = vi.fn().mockReturnValue({ all: allSpy })

    const mockD1Database: Partial<D1Database> = {
      prepare: prepareSpy as D1Database['prepare'],
    }

    const res = await app.request(
      REQUEST_API_PATH.GET_BOOKMARKS,
      {},
      {
        BOOKMARK_PAGE_DB: mockD1Database as D1Database,
      },
    )
    const expectedSQL = BOOKMARKS.SELECT_ALL_WITH_KEYWORDS

    expect(prepareSpy).toHaveBeenCalledWith(expectedSQL)
    expect(allSpy).toHaveBeenCalledOnce()
    expect(res.status).toBe(200)

    // レスポンスボディの検証
    const body = await res.json()
    expect(body).toEqual({
      data: TestBookmarkWithKeywords,
      success: true,
    })
  })

  it('GET /api/bookmarks - DB側で例外が発生した際、適切に500エラーを返すこと', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const dbError = new Error(TEST_ERROR_MESSAGE.DB_ERROR)

    const allSpy = vi.fn().mockRejectedValue(dbError)
    const prepareSpy = vi.fn().mockReturnValue({ all: allSpy })

    const mockFailedDb: Partial<D1Database> = {
      prepare: prepareSpy as D1Database['prepare'],
    }

    const res = await app.request(
      REQUEST_API_PATH.GET_BOOKMARKS,
      {},
      {
        BOOKMARK_PAGE_DB: mockFailedDb as D1Database,
      },
    )

    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json).toEqual({
      error: UI_MESSAGES.API.DB_ERROR,
      success: false,
    })
    expect(consoleSpy).toHaveBeenCalledWith(LOG_MESSAGE.DB_ERROR(dbError))
  })

  it('存在しないパスにアクセスした場合は404になること', async () => {
    const res = await app.request('/api/unknown-route')
    expect(res.status).toBe(404)
  })

  it('データベースのバインディング（BOOKMARK_PAGE_DB）が未設定の場合、500を返すこと', async () => {
    const res = await app.request(
      REQUEST_API_PATH.GET_BOOKMARKS,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET',
      },
      {},
    )

    expect(res.status).toBe(500)

    const body = await res.json()
    expect(body).toEqual({
      error: UI_MESSAGES.API.DB_ERROR,
      success: false,
    })
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(ERROR_MESSAGE.DB_BINDING_ERROR(DATABASE_NAME)),
    )
  })
})
