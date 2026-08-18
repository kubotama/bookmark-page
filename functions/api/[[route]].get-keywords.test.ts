import { D1Database } from '@cloudflare/workers-types'
import { describe, expect, it, vi } from 'vitest'

import { ERROR_MESSAGE, UI_MESSAGES } from '../../shared/constants/uiMessages'
import { DATABASE_NAME, KEYWORDS } from '../constants/db'
import { LOG_MESSAGE } from '../constants/logMessage'
import {
  REQUEST_API_PATH,
  TEST_ERROR_MESSAGE,
  TestKeywords,
  TestKeywordsTableData,
} from '../test/fixtures'
import { app } from './[[route]]'

describe('Hono API - GET /keywords', () => {
  it('GET /api/keywords が正しいJSONを返すこと', async () => {
    const allSpy = vi.fn().mockResolvedValue({
      results: TestKeywordsTableData,
    })
    const prepareSpy = vi.fn().mockReturnValue({ all: allSpy })

    const mockD1Database: Partial<D1Database> = {
      prepare: prepareSpy as D1Database['prepare'],
    }

    const res = await app.request(
      REQUEST_API_PATH.GET_KEYWORDS,
      {},
      {
        BOOKMARK_PAGE_DB: mockD1Database as D1Database,
      },
    )
    const expectedSQL = KEYWORDS.SELECT_ALL_WITH_BOOKMARKS

    expect(prepareSpy).toHaveBeenCalledWith(expectedSQL)
    expect(allSpy).toHaveBeenCalledOnce()
    expect(res.status).toBe(200)

    // レスポンスボディの検証
    const body = await res.json()
    expect(body).toEqual({
      data: TestKeywords,
      success: true,
    })
  })

  it('GET /api/keywords - DB側で例外が発生した際、適切に500エラーを返すこと', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const dbError = new Error(TEST_ERROR_MESSAGE.DB_ERROR)

    const allSpy = vi.fn().mockRejectedValue(dbError)
    const prepareSpy = vi.fn().mockReturnValue({ all: allSpy })

    const mockFailedDb: Partial<D1Database> = {
      prepare: prepareSpy as D1Database['prepare'],
    }

    const res = await app.request(
      REQUEST_API_PATH.GET_KEYWORDS,
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

  it('データベースのバインディング（BOOKMARK_PAGE_DB）が未設定の場合、500を返すこと', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await app.request(
      REQUEST_API_PATH.GET_KEYWORDS,
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
