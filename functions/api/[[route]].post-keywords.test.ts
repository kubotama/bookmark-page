import { D1Database } from '@cloudflare/workers-types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { KEYWORDS } from '../constants/db'
import {
  REQUEST_API_PATH,
  TestKeywords,
  TestKeywordsTableData,
} from '../test/fixtures'
import { app } from './[[route]]'

describe('Hono API - POST /keywords', () => {
  //   let consoleSpy: Mock<(...data: unknown[]) => void>
  beforeEach(() => {
    vi.resetAllMocks()
    // consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  const addedKeyword = TestKeywords[0]

  it('指定した名前でキーワードを作成できること', async () => {
    const requestBody = {
      name: addedKeyword.name,
    }
    const firstSpy = vi.fn().mockResolvedValue(TestKeywordsTableData[0])
    const bindSpy = vi.fn().mockReturnValue({ first: firstSpy })
    const prepareSpy = vi.fn().mockReturnValue({ bind: bindSpy })

    const mockD1Database: Partial<D1Database> = {
      prepare: prepareSpy as D1Database['prepare'],
    }

    const res = await app.request(
      REQUEST_API_PATH.ADD_KEYWORD,
      {
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
      {
        BOOKMARK_PAGE_DB: mockD1Database as D1Database,
      },
    )

    expect(res.status).toBe(201)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.name).toBe(addedKeyword.name)
    expect(json.data.id).toBeDefined()

    expect(prepareSpy).toHaveBeenCalledWith(KEYWORDS.INSERT)
  })
})
