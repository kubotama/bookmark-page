import { D1Database } from '@cloudflare/workers-types'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'

import { SCHEMA_MESSAGE } from '../../shared/constants/validation'
import { BOOKMARKS, BOOKMARKS_KEYWORDS, KEYWORDS } from '../constants/db'
import { Uuid } from '../schemas/common'
import {
  INVALID_STRING,
  REQUEST_API_PATH,
  TEST_STRING,
  TestBookmarkWithKeywords,
  TestKeywords,
} from '../test/fixtures'
import { app } from './[[route]]'

const firstSpy = vi.fn()
const bindSpy = vi.fn()
const prepareSpy = vi.fn()
const b1 = TestBookmarkWithKeywords[0]
const k1 = TestKeywords[0]

describe('Hono API - POST /api/bookmarks/:bookmark_id/keywords', () => {
  let consoleSpy: Mock<(...data: unknown[]) => void>
  let validId: Uuid

  beforeEach(() => {
    vi.resetAllMocks()
    prepareSpy.mockReturnValue({ bind: bindSpy })
    bindSpy.mockReturnValue({
      first: firstSpy,
    })
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    validId = uuidv7()
  })

  it('キーワードをブックマークに紐付けられること', async () => {
    firstSpy
      .mockResolvedValueOnce({ id: b1.id })
      .mockResolvedValueOnce({ id: k1.id })
      .mockResolvedValue({ bookmark_id: b1.id, id: validId, keyword_id: k1.id })

    const mockD1Database: Partial<D1Database> = {
      prepare: prepareSpy as D1Database['prepare'],
    }

    const res = await app.request(
      REQUEST_API_PATH.ASSIGN_KEYWORD(b1.id),
      {
        body: JSON.stringify({ keyword_id: k1.id }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      },
      { BOOKMARK_PAGE_DB: mockD1Database as D1Database },
    )

    expect(res.status).toBe(201)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.id).toBe(validId)
    expect(json.data.bookmark_id).toBe(b1.id)
    expect(json.data.keyword_id).toBe(k1.id)

    expect(prepareSpy).toHaveBeenNthCalledWith(1, BOOKMARKS.SELECT_ID)
    expect(prepareSpy).toHaveBeenNthCalledWith(2, KEYWORDS.SELECT_ID)
    expect(prepareSpy).toHaveBeenNthCalledWith(3, BOOKMARKS_KEYWORDS.INSERT)

    expect(consoleSpy).toHaveBeenCalledTimes(0)
  })

  it('ブックマークidが不正な場合', async () => {
    const mockD1Database: Partial<D1Database> = {
      prepare: prepareSpy as D1Database['prepare'],
    }

    const res = await app.request(
      REQUEST_API_PATH.ASSIGN_KEYWORD(INVALID_STRING.ID),
      {
        body: JSON.stringify({ keyword_id: k1.id }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      },
      { BOOKMARK_PAGE_DB: mockD1Database as D1Database },
    )

    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toBe(SCHEMA_MESSAGE.INVALID_ID_FORMAT)

    expect(prepareSpy).toHaveBeenCalledTimes(0)

    expect(consoleSpy).toHaveBeenCalledTimes(0)
  })
})
