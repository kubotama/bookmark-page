import { D1Database } from '@cloudflare/workers-types'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'

import { SCHEMA_MESSAGE } from '../../shared/constants/validation'
import { KEYWORDS } from '../constants/db'
import { INVALID_STRING, REQUEST_API_PATH } from '../test/fixtures'
import { app } from './[[route]]'

const mockPrepare = vi.fn()
const mockBind = vi.fn()
const mockRun = vi.fn()

const mockDb = {
  prepare: mockPrepare,
}

describe('DELETE /api/keywords/', () => {
  // 毎テスト前にモックのチェーンをリセット
  beforeEach(() => {
    vi.resetAllMocks()
    mockPrepare.mockReturnValue({ bind: mockBind })
    mockBind.mockReturnValue({
      run: mockRun,
    })
  })

  const validId = uuidv7() // 正しい形式のUUID

  describe('Hono API - DELETE /api/keywords (正常系)', () => {
    // -------------------------------------------------------------
    // 1. 正常にキーワードが削除できた場合 (204)
    // -------------------------------------------------------------
    it('正常なIDが指定された場合、削除に成功して204を返すこと', async () => {
      // 存在確認でデータを返すよう設定
      // 削除実行で成功（{ success: true }）を返すよう設定
      mockRun.mockResolvedValueOnce({ success: true })

      const res = await app.request(
        REQUEST_API_PATH.DELETE_KEYWORD(validId),
        { method: 'DELETE' },
        { BOOKMARK_PAGE_DB: mockDb as unknown as D1Database },
      )

      expect(res.status).toBe(204)
      expect(res.body).toBeNull() // 204なのでボディは空

      expect(mockPrepare).toHaveBeenCalledWith(KEYWORDS.DELETE)
      expect(mockBind).toHaveBeenCalledWith(validId)
      expect(mockRun).toHaveBeenCalledWith()
    })
  })

  describe('Hono API - DELETE /api/keywords (異常系)', () => {
    let consoleSpy: Mock<(...data: unknown[]) => void>
    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    // -------------------------------------------------------------
    // 2. 指定されたIDの形式が無効な場合 (400)
    // -------------------------------------------------------------
    it('無効なID形式（非UUID）が指定された場合、400を返すこと', async () => {
      const invalidId = INVALID_STRING.ID

      const res = await app.request(
        REQUEST_API_PATH.DELETE_KEYWORD(invalidId),
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
    })
  })
})
