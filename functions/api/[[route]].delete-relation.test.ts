import { D1Database } from '@cloudflare/workers-types'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ERROR_MESSAGE, UI_MESSAGES } from '../../shared/constants/uiMessages'
import { SCHEMA_MESSAGE } from '../../shared/constants/validation'
import { BOOKMARKS_KEYWORDS, DATABASE_NAME } from '../constants/db'
import { LOG_MESSAGE } from '../constants/logMessage'
import { INVALID_STRING, REQUEST_API_PATH } from '../test/fixtures'
import { app } from './[[route]]'

const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

const mockPrepare = vi.fn()
const mockBind = vi.fn()
const mockRun = vi.fn()

const mockDb = {
  prepare: mockPrepare,
}

describe('DELETE /bookmarks/:bookmark_id/keywords/:keyword_id', () => {
  const prepareIds = (ids?: { bookmark_id?: string; keyword_id?: string }) => {
    return {
      bookmark_id: ids?.bookmark_id ?? uuidv7(),
      keyword_id: ids?.keyword_id ?? uuidv7(),
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockPrepare.mockReturnValue({ bind: mockBind })
    mockBind.mockReturnValue({
      run: mockRun,
    })
  })

  describe('正常系', () => {
    const testCases = [
      {
        changes: 1,
        testName: '正常なIDが指定された場合、削除に成功して204を返すこと',
      },
      {
        changes: 0,
        testName:
          '対象の関連付けが存在しない場合（changes: 0）でも、冪等性によりエラーにならず204を返すこと',
      },
    ]
    it.each(testCases)(`$testName`, async ({ changes }) => {
      mockRun.mockResolvedValueOnce({ meta: { changes }, success: true })
      const { bookmark_id, keyword_id } = prepareIds()

      const res = await app.request(
        REQUEST_API_PATH.UNASSIGN_RELATION(bookmark_id, keyword_id),
        { method: 'DELETE' },
        { BOOKMARK_PAGE_DB: mockDb as unknown as D1Database },
      )

      expect(res.status).toBe(204)
      expect(res.body).toBeNull() // 204なのでボディは空

      expect(mockPrepare).toHaveBeenCalledWith(BOOKMARKS_KEYWORDS.DELETE)
      expect(mockBind).toHaveBeenCalledWith(bookmark_id, keyword_id)
      expect(mockRun).toHaveBeenCalledWith()
      expect(consoleSpy).toHaveBeenCalledTimes(0)
    })
  })
  describe('異常系', () => {
    type TestCase = {
      dbBinding?: unknown
      errorName: string
      expectedBody?: { error: string; success: boolean }
      expectedConsole?: string
      expectedText?: string
      params?: { bookmark_id?: string; keyword_id?: string }
      setup?: () => void
      status: number
    }
    const dbError = new Error(UI_MESSAGES.API.DB_ERROR)

    const testCases: TestCase[] = [
      // -------------------------------------------------------------
      // 指定されたIDの形式が無効な場合 (400)
      // -------------------------------------------------------------
      {
        errorName: '無効な keyword_id（非UUID）が指定された',
        expectedBody: {
          error: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
          success: false,
        },
        params: { bookmark_id: INVALID_STRING.ID },
        status: 400,
      },
      {
        errorName: '無効な bookmark_id（非UUID）が指定された',
        expectedBody: {
          error: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
          success: false,
        },
        params: { keyword_id: INVALID_STRING.ID },
        status: 400,
      },
      // -------------------------------------------------------------
      // IDが未指定の場合 (404)
      // -------------------------------------------------------------
      {
        errorName: 'bookmark_idを指定しない',
        expectedText: '404 Not Found',
        params: { bookmark_id: '' },
        status: 404,
      },
      {
        errorName: 'keyword_idを指定しない',
        expectedText: '404 Not Found',
        params: { keyword_id: '' },
        status: 404,
      },
      // -------------------------------------------------------------
      // データベースの削除処理中に例外が発生した場合 (500)
      // -------------------------------------------------------------
      {
        errorName: 'データベースの削除処理中に例外が発生した',
        expectedBody: {
          error: UI_MESSAGES.API.DB_ERROR,
          success: false,
        },
        expectedConsole: LOG_MESSAGE.DB_ERROR(dbError),
        setup: () => {
          mockRun.mockRejectedValueOnce(dbError)
        },
        status: 500,
      },
      // -------------------------------------------------------------
      // データベースの削除処理結果が失敗（success: false）を返した場合 (500)
      // -------------------------------------------------------------
      {
        errorName: 'データベースの削除処理結果が失敗（success: false）を返した',
        expectedBody: {
          error: UI_MESSAGES.API.DB_ERROR,
          success: false,
        },
        expectedConsole: expect.stringContaining(
          ERROR_MESSAGE.FAILED_DELETE_KEYWORD,
        ),
        setup: () => {
          mockRun.mockResolvedValueOnce({ success: false })
        },
        status: 500,
      },
      // -------------------------------------------------------------
      // データベースのバインディング（BOOKMARK_PAGE_DB）が未設定の場合 (500)
      // -------------------------------------------------------------
      {
        dbBinding: {},
        errorName: 'データベースのバインディング（BOOKMARK_PAGE_DB）が未設定の',
        expectedBody: {
          error: UI_MESSAGES.API.DB_ERROR,
          success: false,
        },
        expectedConsole: expect.stringContaining(
          ERROR_MESSAGE.DB_BINDING_ERROR(DATABASE_NAME),
        ),
        status: 500,
      },
    ]
    it.each(testCases)(
      '$errorName 場合、$status を返すこと',
      async ({
        dbBinding,
        expectedBody,
        expectedConsole,
        expectedText,
        params,
        setup,
        status,
      }) => {
        if (setup) setup()

        const { bookmark_id, keyword_id } = prepareIds(params)

        const res = await app.request(
          REQUEST_API_PATH.UNASSIGN_RELATION(bookmark_id, keyword_id),
          { method: 'DELETE' },
          dbBinding ?? { BOOKMARK_PAGE_DB: mockDb as unknown as D1Database },
        )

        expect(res.status).toBe(status)
        if (expectedBody) {
          const resBody = await res.json()
          expect(resBody).toEqual(expectedBody)
        }
        if (expectedText) {
          const resText = await res.text()
          expect(resText).toEqual(expectedText)
        }
        if (expectedConsole) {
          expect(consoleSpy).toHaveBeenCalledWith(expectedConsole)
        } else {
          expect(consoleSpy).toHaveBeenCalledTimes(0)
        }
      },
    )
  })
})
