import { D1Database } from '@cloudflare/workers-types'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'

import { UI_MESSAGES } from '../../shared/constants/uiMessages'
import { SCHEMA_MESSAGE } from '../../shared/constants/validation'
import { KEYWORDS } from '../constants/db'
import {
  INVALID_STRING,
  REQUEST_API_PATH,
  TestKeywords,
} from '../test/fixtures'
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

  type TestCase = {
    description: string
    expectedError: string
    id: string
    payload: { name?: string }
  }

  const testCases: TestCase[] = [
    {
      description: 'IDが不正な形式',
      expectedError: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
      id: INVALID_STRING.ID,
      payload: { name: TestKeywords[0].name },
    },
    {
      description: 'キーワード名が不足',
      expectedError: SCHEMA_MESSAGE.KEYWORD_REQUIRED,
      id: updateKeyword.id,
      payload: {},
    },
    {
      description: 'キーワード名の長さ不足',
      expectedError: SCHEMA_MESSAGE.MIN_LENGTH_KEYWORD,
      id: updateKeyword.id,
      payload: { name: '' },
    },
  ]

  describe('異常系(400): ', () => {
    it.each(testCases)(
      `$description`,
      async ({ expectedError, id, payload }) => {
        const mockD1Database: Partial<D1Database> = {
          prepare: mockPrepare as D1Database['prepare'],
        }

        const res = await app.request(
          REQUEST_API_PATH.UPDATE_KEYWORD(id),
          {
            body: JSON.stringify(payload),
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'PATCH',
          },
          {
            BOOKMARK_PAGE_DB: mockD1Database as D1Database,
          },
        )

        expect(res.status).toBe(400)
        const json = await res.json()
        expect(json.success).toBe(false)
        expect(json.error).toBe(expectedError)

        expect(mockPrepare).not.toHaveBeenCalled()
      },
    )
  })

  describe('異常系(404): ', () => {
    it('データベースの更新結果が0件の場合', async () => {
      mockFirst.mockResolvedValueOnce(null)

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

      expect(res.status).toBe(404)

      const body = await res.json()
      expect(body).toEqual({
        error: UI_MESSAGES.API.NOT_FOUND_KEYWORD,
        success: false,
      })
    })

    it('IDを指定せずにUPDATEを呼び出した場合、Hono標準の404を返すこと', async () => {
      const mockD1Database: Partial<D1Database> = {
        prepare: mockPrepare as D1Database['prepare'],
      }

      const res = await app.request(
        REQUEST_API_PATH.UPDATE_KEYWORD(''),
        { method: 'PATCH' },
        { BOOKMARK_PAGE_DB: mockD1Database as D1Database },
      )

      expect(res.status).toBe(404)
      expect(res.statusText).toBe('')
    })
  })
})
