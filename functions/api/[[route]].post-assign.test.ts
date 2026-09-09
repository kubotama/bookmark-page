import { D1Database } from '@cloudflare/workers-types'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'

import { UI_MESSAGES } from '../../shared/constants/uiMessages'
import { SCHEMA_MESSAGE } from '../../shared/constants/validation'
import { BOOKMARKS, BOOKMARKS_KEYWORDS, KEYWORDS } from '../constants/db'
import { Uuid } from '../schemas/common'
import {
  INVALID_STRING,
  REQUEST_API_PATH,
  TestBookmarkWithKeywords,
  TestKeywords,
} from '../test/fixtures'
import { app } from './[[route]]'

const firstSpy = vi.fn()
const bindSpy = vi.fn()
const prepareSpy = vi.fn()
const b1 = TestBookmarkWithKeywords[0]
const k1 = TestKeywords[0]

type ApiAssignParam = {
  bookmark_id?: string
  id?: string
  keyword_id?: string
}

const helperApiAssign = async (param?: ApiAssignParam) => {
  const id = param?.id ?? uuidv7()
  const bookmark_id = param?.bookmark_id ?? TestBookmarkWithKeywords[0].id
  const keyword_id = param?.keyword_id ?? TestKeywords[0].id

  const mockD1Database: Partial<D1Database> = {
    prepare: prepareSpy as D1Database['prepare'],
  }

  const res = await app.request(
    REQUEST_API_PATH.ASSIGN_KEYWORD(bookmark_id),
    {
      body: JSON.stringify({ keyword_id }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    },
    { BOOKMARK_PAGE_DB: mockD1Database as D1Database },
  )
  return { expectedData: { bookmark_id, id, keyword_id }, res }
}

describe('Hono API - POST /api/bookmarks/:bookmark_id/keywords', () => {
  let consoleSpy: Mock
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

    const { expectedData, res } = await helperApiAssign({
      bookmark_id: b1.id,
      id: validId,
      keyword_id: k1.id,
    })

    expect(res.status).toBe(201)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toEqual(expectedData)

    expect(prepareSpy).toHaveBeenNthCalledWith(1, BOOKMARKS.SELECT_ID)
    expect(prepareSpy).toHaveBeenNthCalledWith(2, KEYWORDS.SELECT_ID)
    expect(prepareSpy).toHaveBeenNthCalledWith(3, BOOKMARKS_KEYWORDS.INSERT)

    expect(consoleSpy).toHaveBeenCalledTimes(0)
  })

  type TestCase = {
    bookmark_id?: string
    errorName: string
    keyword_id?: string
  }

  const testCases: TestCase[] = [
    {
      bookmark_id: INVALID_STRING.ID,
      errorName: 'ブックマークidが不正な場合',
    },
    {
      errorName: 'キーワードidが不正な場合',
      keyword_id: INVALID_STRING.ID,
    },
  ]

  it.each(testCases)(`$errorName`, async ({ bookmark_id, keyword_id }) => {
    const { res } = await helperApiAssign({ bookmark_id, keyword_id })

    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toBe(SCHEMA_MESSAGE.INVALID_ID_FORMAT)

    expect(prepareSpy).toHaveBeenCalledTimes(0)
    expect(consoleSpy).toHaveBeenCalledTimes(0)
  })

  it('指定されたidのブックマークが存在しない場合', async () => {
    firstSpy.mockResolvedValueOnce(null)

    const { res } = await helperApiAssign()

    expect(res.status).toBe(404)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toBe(UI_MESSAGES.API.NOT_FOUND_BOOKMARK)

    expect(prepareSpy).toHaveBeenCalledTimes(1)
    expect(consoleSpy).toHaveBeenCalledTimes(0)
  })

  it('指定されたidのキーワードが存在しない場合', async () => {
    firstSpy.mockResolvedValueOnce({ id: b1.id }).mockResolvedValueOnce(null)

    const { res } = await helperApiAssign()

    expect(res.status).toBe(404)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toBe(UI_MESSAGES.API.NOT_FOUND_KEYWORD)

    expect(prepareSpy).toHaveBeenCalledTimes(2)
    expect(consoleSpy).toHaveBeenCalledTimes(0)
  })

  it('IDを指定せずにキーワードの関連付けを呼び出した場合、Hono標準の404を返すこと', async () => {
    const { res } = await helperApiAssign({ bookmark_id: '' })

    expect(res.status).toBe(404)
    const text = await res.text()
    expect(text).toBe('404 Not Found')

    expect(prepareSpy).toHaveBeenCalledTimes(0)
    expect(consoleSpy).toHaveBeenCalledTimes(0)
  })
})
