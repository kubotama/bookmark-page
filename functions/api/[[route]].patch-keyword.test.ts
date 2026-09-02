import { D1Database } from '@cloudflare/workers-types'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'

import { KEYWORDS } from '../constants/db'
import { REQUEST_API_PATH, TestKeywords } from '../test/fixtures'
import { app } from './[[route]]'

describe('Hono API - POST /api/keywords/:id', () => {
  const mockPrepare = vi.fn()
  const mockBind = vi.fn()
  const mockFirst = vi.fn()
  const updateKeyword = TestKeywords[0]
  const requestBody = {
    name: updateKeyword.name,
  }

  let consoleSpy: Mock<(...data: unknown[]) => void>

  beforeEach(() => {
    vi.resetAllMocks()
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockPrepare.mockReturnValue({ bind: mockBind })
    mockBind.mockReturnValue({
      first: mockFirst,
    })
  })

  it('正常系: 有効なパラメータを送信したとき、キーワードが更新されて200を返すこと', async () => {
    mockFirst.mockResolvedValueOnce(updateKeyword)

    const mockD1Database: Partial<D1Database> = {
      prepare: mockPrepare as D1Database['prepare'],
    }

    const res = await app.request(
      REQUEST_API_PATH.UPDATE_KEYWORD(updateKeyword.id),
      {
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      },
      {
        BOOKMARK_PAGE_DB: mockD1Database as D1Database,
      },
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.name).toBe(updateKeyword.name)
    expect(json.data.id).toBe(updateKeyword.id)

    expect(mockPrepare).toHaveBeenCalledWith(KEYWORDS.UPDATE)
    expect(mockBind).toHaveBeenCalledWith(requestBody.name, updateKeyword.id)
    expect(consoleSpy).not.toHaveBeenCalled()
  })
})
