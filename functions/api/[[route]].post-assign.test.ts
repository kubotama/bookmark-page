import { D1Database } from '@cloudflare/workers-types'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

type ApiAssignParam = {
  bookmark_id?: string
  id?: string
  keyword_id?: string
  omitKeywordId?: boolean
}

const helperApiAssign = async (param?: ApiAssignParam) => {
  const id = param?.id ?? uuidv7()
  const bookmark_id = param?.bookmark_id ?? TestBookmarkWithKeywords[0].id
  const body = param?.omitKeywordId
    ? {}
    : { keyword_id: param?.keyword_id ?? TestKeywords[0].id }

  const mockD1Database: Partial<D1Database> = {
    prepare: prepareSpy as D1Database['prepare'],
  }

  const res = await app.request(
    REQUEST_API_PATH.ASSIGN_KEYWORD(bookmark_id),
    {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    },
    { BOOKMARK_PAGE_DB: mockD1Database as D1Database },
  )
  return { expectedData: { bookmark_id, id, keyword_id: body.keyword_id }, res }
}

type ApiAssignErrorParam = {
  consoleCalled?: number
  message: string
  prepareCalled?: number
  status: number
}

const expectApiAssignError = async (
  res: Response,
  param: ApiAssignErrorParam,
) => {
  expect(res.status).toBe(param.status)

  const json = await res.json()
  expect(json.success).toBe(false)
  expect(json.error).toBe(param.message)

  const prepareCalled = param.prepareCalled ?? 0
  const consoleCalled = param.consoleCalled ?? 0

  expect(prepareSpy).toHaveBeenCalledTimes(prepareCalled)
  expect(consoleSpy).toHaveBeenCalledTimes(consoleCalled)
}

describe('Hono API - POST /api/bookmarks/:bookmark_id/keywords', () => {
  let validId: Uuid

  beforeEach(() => {
    vi.clearAllMocks()
    prepareSpy.mockReturnValue({ bind: bindSpy })
    bindSpy.mockReturnValue({
      first: firstSpy,
    })
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

  it('IDを指定せずにキーワードの関連付けを呼び出した場合、Hono標準の404を返すこと', async () => {
    const { res } = await helperApiAssign({ bookmark_id: '' })

    expect(res.status).toBe(404)

    const text = await res.text()
    expect(text).toBe('404 Not Found')
    expect(prepareSpy).toHaveBeenCalledTimes(0)
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

    await expectApiAssignError(res, {
      message: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
      status: 400,
    })
  })

  it('指定されたidのブックマークが存在しない場合', async () => {
    firstSpy.mockResolvedValueOnce(null)

    const { res } = await helperApiAssign()

    await expectApiAssignError(res, {
      message: UI_MESSAGES.API.NOT_FOUND_BOOKMARK,
      prepareCalled: 1,
      status: 404,
    })
  })

  it('指定されたidのキーワードが存在しない場合', async () => {
    firstSpy.mockResolvedValueOnce({ id: b1.id }).mockResolvedValueOnce(null)

    const { res } = await helperApiAssign()

    await expectApiAssignError(res, {
      message: UI_MESSAGES.API.NOT_FOUND_KEYWORD,
      prepareCalled: 2,
      status: 404,
    })
  })

  it('リクエストボディに keyword_id が含まれていない場合、400エラーを返すこと', async () => {
    const { res } = await helperApiAssign({ omitKeywordId: true })

    await expectApiAssignError(res, {
      message: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
      status: 400,
    })
  })
})
