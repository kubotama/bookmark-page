import { D1Database } from '@cloudflare/workers-types'
import { describe, expect, it, vi } from 'vitest'

import { KEYWORDS } from '../constants/db'
import { REQUEST_API_PATH, TestKeywords } from '../test/fixtures'
import { app } from './[[route]]'

describe('Hono API - GET /keywords', () => {
  it('GET /api/keywords が正しいJSONを返すこと', async () => {
    const allSpy = vi.fn().mockResolvedValue({
      results: TestKeywords,
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
    const expectedSQL = KEYWORDS.SELECT_ALL

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
})
