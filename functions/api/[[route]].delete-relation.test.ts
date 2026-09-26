import { D1Database } from '@cloudflare/workers-types'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UI_MESSAGES } from '../../shared/constants/uiMessages'
import { SCHEMA_MESSAGE } from '../../shared/constants/validation'
import { BOOKMARKS_KEYWORDS } from '../constants/db'
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
  let bookmark_id: string
  let keyword_id: string

  beforeEach(() => {
    vi.clearAllMocks()
    mockPrepare.mockReturnValue({ bind: mockBind })
    mockBind.mockReturnValue({
      run: mockRun,
    })
    bookmark_id = uuidv7()
    keyword_id = uuidv7()
  })

  describe('正常系', () => {
    it('正常なIDが指定された場合、削除に成功して204を返すこと', async () => {
      mockRun.mockResolvedValueOnce({ meta: { changes: 1 }, success: true })

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

    it('対象の関連付けが存在しない場合（changes: 0）でも、冪等性によりエラーにならず204を返すこと', async () => {
      mockRun.mockResolvedValueOnce({ meta: { changes: 0 }, success: true })

      const res = await app.request(
        REQUEST_API_PATH.UNASSIGN_RELATION(bookmark_id, keyword_id),
        { method: 'DELETE' },
        { BOOKMARK_PAGE_DB: mockDb as unknown as D1Database },
      )

      expect(res.status).toBe(204)
      expect(res.body).toBeNull()
    })
  })
  describe('異常系', () => {
    type TestCase = {
      errorName: string
      expectedBody?: { error: string; success: boolean }
      expectedConsole?: string
      expectedText?: string
      getParams: () => { bookmark_id: string; keyword_id: string }
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
        getParams: () => ({ bookmark_id: INVALID_STRING.ID, keyword_id }),
        status: 400,
      },
      {
        errorName: '無効な bookmark_id（非UUID）が指定された',
        expectedBody: {
          error: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
          success: false,
        },
        getParams: () => ({ bookmark_id, keyword_id: INVALID_STRING.ID }),
        status: 400,
      },
      // -------------------------------------------------------------
      // IDが未指定の場合 (404)
      // -------------------------------------------------------------
      {
        errorName: 'bookmark_idを指定しない',
        expectedText: '404 Not Found',
        getParams: () => ({ bookmark_id: '', keyword_id }),
        status: 404,
      },
      {
        errorName: 'keyword_idを指定しない',
        expectedText: '404 Not Found',
        getParams: () => ({ bookmark_id, keyword_id: '' }),
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
        getParams: () => ({ bookmark_id, keyword_id }),
        setup: () => {
          mockRun.mockRejectedValueOnce(dbError)
        },
        status: 500,
      },
    ]
    it.each(testCases)(
      '$errorName 場合、$status を返すこと',
      async ({
        expectedBody,
        expectedConsole,
        expectedText,
        getParams,
        setup,
        status,
      }) => {
        if (setup) setup()

        const params = getParams()

        const res = await app.request(
          REQUEST_API_PATH.UNASSIGN_RELATION(
            params.bookmark_id,
            params.keyword_id,
          ),
          { method: 'DELETE' },
          { BOOKMARK_PAGE_DB: mockDb as unknown as D1Database },
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
