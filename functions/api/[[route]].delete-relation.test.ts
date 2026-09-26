import { D1Database } from '@cloudflare/workers-types'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SCHEMA_MESSAGE } from '../../shared/constants/validation'
import { BOOKMARKS_KEYWORDS } from '../constants/db'
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
      params: { bookmark_id: string; keyword_id: string }
    }

    // -------------------------------------------------------------
    // 指定されたIDの形式が無効な場合 (400)
    // -------------------------------------------------------------
    const testCases: TestCase[] = [
      {
        errorName: '無効な keyword_id（非UUID）',
        params: { bookmark_id: INVALID_STRING.ID, keyword_id },
      },
      {
        errorName: '無効な bookmark_id（非UUID）',
        params: { bookmark_id, keyword_id: INVALID_STRING.ID },
      },
    ]
    it.each(testCases)(
      '$errorName が指定された場合、400を返すこと',
      async ({ params }) => {
        const res = await app.request(
          REQUEST_API_PATH.UNASSIGN_RELATION(
            params.bookmark_id,
            params.keyword_id,
          ),
          { method: 'DELETE' },
          { BOOKMARK_PAGE_DB: mockDb as unknown as D1Database },
        )

        expect(res.status).toBe(400)
        const body = await res.json()
        expect(body).toEqual({
          error: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
          success: false,
        })
        expect(consoleSpy).toHaveBeenCalledTimes(0)
      },
    )
  })
})
