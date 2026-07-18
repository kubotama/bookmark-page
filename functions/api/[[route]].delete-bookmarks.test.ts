import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { app } from './[[route]]' // appのインポートパスは環境に合わせて調整してください
import { uuidv7 } from 'uuidv7'
import { D1Database } from '@cloudflare/workers-types'
import { SCHEMA_MESSAGE } from '../../shared/constants/validation'
import {
  INVALID_STRING,
  REQUEST_API_PATH,
  TEST_ERROR_MESSAGE,
} from '../test/fixtures'
import { ERROR_MESSAGE } from '../../shared/constants/uiMessages'
import { API_MESSAGE } from '../../shared/constants/api'
import { LOG_MESSAGE } from '../constants/logMessage'
import { DATABASE_NAME } from '../constants/db'

// D1 データベースの準備（モック用）
const mockPrepare = vi.fn()
const mockBind = vi.fn()
const mockRun = vi.fn()

const mockDb = {
  prepare: mockPrepare,
}

describe('DELETE /api/bookmarks/:id', () => {
  // 毎テスト前にモックのチェーンをリセット
  beforeEach(() => {
    vi.resetAllMocks()
    mockPrepare.mockReturnValue({ bind: mockBind })
    mockBind.mockReturnValue({
      run: mockRun,
    })
  })

  const validId = uuidv7() // 正しい形式のUUID

  // -------------------------------------------------------------
  // 1. 正常にブックマークが削除できた場合 (204)
  // -------------------------------------------------------------
  it('正常なIDが指定された場合、削除に成功して204を返すこと', async () => {
    // 存在確認でデータを返すよう設定
    // 削除実行で成功（{ success: true }）を返すよう設定
    mockRun.mockResolvedValueOnce({ success: true })

    const res = await app.request(
      REQUEST_API_PATH.DELETE_BOOKMARK(validId),
      { method: 'DELETE' },
      { BOOKMARK_PAGE_DB: mockDb as unknown as D1Database },
    )

    expect(res.status).toBe(204)
    expect(res.body).toBeNull() // 204なのでボディは空
  })

  describe('Hono API - DELETE /api/bookmarks (異常系)', () => {
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
        REQUEST_API_PATH.DELETE_BOOKMARK(invalidId),
        { method: 'DELETE' },
        { BOOKMARK_PAGE_DB: mockDb as unknown as D1Database },
      )

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body).toEqual({
        success: false,
        error: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
      })
    })

    // -------------------------------------------------------------
    // 3. 指定されたIDのブックマークが存在しない場合 (204)
    // -------------------------------------------------------------
    it('存在しないIDが指定された場合も、削除に成功して204を返すこと（冪等性の担保）', async () => {
      // 削除実行で成功（{ success: true }）を返すよう設定
      mockRun.mockResolvedValueOnce({ success: true })

      const res = await app.request(
        REQUEST_API_PATH.DELETE_BOOKMARK(validId),
        { method: 'DELETE' },
        { BOOKMARK_PAGE_DB: mockDb as unknown as D1Database },
      )

      expect(res.status).toBe(204)
      expect(res.body).toBeNull()
    })

    it('IDを指定せずにDELETEを呼び出した場合、Hono標準の404を返すこと', async () => {
      const res = await app.request(
        REQUEST_API_PATH.DELETE_BOOKMARK(''),
        { method: 'DELETE' },
        { BOOKMARK_PAGE_DB: mockDb as unknown as D1Database },
      )

      expect(res.status).toBe(404)
    })

    it('データベースの削除処理中に例外が発生した場合、500を返すこと', async () => {
      // 削除処理の段階で例外エラーをスローさせる
      const dbError = new Error(TEST_ERROR_MESSAGE.DB_ERROR)

      mockRun.mockRejectedValueOnce(dbError)

      const res = await app.request(
        REQUEST_API_PATH.DELETE_BOOKMARK(validId),
        { method: 'DELETE' },
        { BOOKMARK_PAGE_DB: mockDb as unknown as D1Database },
      )

      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body).toEqual({
        success: false,
        error: TEST_ERROR_MESSAGE.DB_ERROR,
      })
      expect(consoleSpy).toHaveBeenCalledWith(LOG_MESSAGE.DB_ERROR(dbError))
    })

    it('データベースの削除処理中にエラーが発生した場合、500を返すこと', async () => {
      // 削除処理の段階で例外エラーをスローさせる
      mockRun.mockResolvedValueOnce({ success: false })

      const res = await app.request(
        REQUEST_API_PATH.DELETE_BOOKMARK(validId),
        { method: 'DELETE' },
        { BOOKMARK_PAGE_DB: mockDb as unknown as D1Database },
      )

      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body).toEqual({
        success: false,
        error: TEST_ERROR_MESSAGE.DB_ERROR,
      })
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(ERROR_MESSAGE.FAILED_DELETE_BOOKMARK),
      )
    })

    it('データベースのバインディング（BOOKMARK_PAGE_DB）が未設定の場合、500を返すこと', async () => {
      const res = await app.request(
        `/api/bookmarks/${validId}`,
        { method: 'DELETE' },
        {},
      )

      expect(res.status).toBe(500)

      const body = await res.json()
      expect(body).toEqual({
        success: false,
        error: API_MESSAGE.DB_ERROR,
      })
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(ERROR_MESSAGE.DB_BINDING_ERROR(DATABASE_NAME)),
      )
    })
  })
})
