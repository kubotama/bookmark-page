import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { app } from './[[route]]' // appのインポートパスは環境に合わせて調整してください
import {
  INVALID_STRING,
  REQUEST_API_PATH,
  TEST_ERROR_MESSAGE,
  TestBookmarks,
} from '../test/fixtures'
import { D1Database } from '@cloudflare/workers-types'
import { BOOKMARKS, DATABASE_NAME } from '../constants/db'
import { SCHEMA_MESSAGE } from '../../shared/constants/validation'
import { ERROR_MESSAGE, UI_MESSAGES } from '../../shared/constants/uiMessages'
import { LOG_MESSAGE } from '../constants/logMessage'

// D1 データベースの準備（モック用）

describe('Hono API - PATCH /api/bookmarks/:id', () => {
  const mockPrepare = vi.fn()
  const mockBind = vi.fn()
  const mockFirst = vi.fn()
  const updateBookmark = TestBookmarks[0]
  const requestBody = {
    title: updateBookmark.title,
    url: updateBookmark.url,
  }

  let consoleSpy: Mock<(...data: unknown[]) => void>
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.resetAllMocks()
    mockPrepare.mockReturnValue({ bind: mockBind })
    mockBind.mockReturnValue({
      first: mockFirst,
    })
  })

  it('正常系: 有効なパラメータを送信したとき、ブックマークが更新されて200を返すこと', async () => {
    mockFirst.mockResolvedValueOnce(updateBookmark)

    const mockD1Database: Partial<D1Database> = {
      prepare: mockPrepare as D1Database['prepare'],
    }

    const res = await app.request(
      REQUEST_API_PATH.UPDATE_BOOKMARK(updateBookmark.id),
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
      {
        BOOKMARK_PAGE_DB: mockD1Database as D1Database,
      },
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.title).toBe(updateBookmark.title)
    expect(json.data.url).toBe(updateBookmark.url)
    expect(json.data.id).toBe(updateBookmark.id)

    expect(mockPrepare).toHaveBeenCalledWith(BOOKMARKS.UPDATE)
    expect(mockBind).toHaveBeenCalledWith(
      requestBody.title,
      requestBody.url,
      updateBookmark.id,
    )
  })

  describe('異常系(400): ', () => {
    it.each([
      {
        description: 'IDが不正な形式',
        id: INVALID_STRING.ID,
        invalidBody: { title: updateBookmark.title, url: updateBookmark.url },
        expectedError: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
      },
      {
        description: 'タイトルが不足',
        id: updateBookmark.id,
        invalidBody: { url: updateBookmark.url },
        expectedError: SCHEMA_MESSAGE.TITLE_REQUIRED,
      },
      {
        description: 'urlが不足',
        id: updateBookmark.id,
        invalidBody: { title: updateBookmark.title },
        expectedError: SCHEMA_MESSAGE.URL_REQUIRED,
      },
    ])(`$description`, async ({ invalidBody, expectedError, id }) => {
      const mockD1Database: Partial<D1Database> = {
        prepare: mockPrepare as D1Database['prepare'],
      }

      const res = await app.request(
        REQUEST_API_PATH.UPDATE_BOOKMARK(id),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invalidBody),
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
    })
  })

  describe('異常系(404): ', () => {
    it('データベースの更新結果が0件の場合', async () => {
      mockFirst.mockResolvedValueOnce(null)

      const mockD1Database: Partial<D1Database> = {
        prepare: mockPrepare as D1Database['prepare'],
      }

      const res = await app.request(
        REQUEST_API_PATH.UPDATE_BOOKMARK(updateBookmark.id),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
        {
          BOOKMARK_PAGE_DB: mockD1Database as D1Database,
        },
      )

      expect(res.status).toBe(404)

      const body = await res.json()
      expect(body).toEqual({
        success: false,
        error: UI_MESSAGES.API.NOT_FOUND_BOOKMARK,
      })
    })

    it('IDを指定せずにUPDATEを呼び出した場合、Hono標準の404を返すこと', async () => {
      const mockD1Database: Partial<D1Database> = {
        prepare: mockPrepare as D1Database['prepare'],
      }

      const res = await app.request(
        REQUEST_API_PATH.UPDATE_BOOKMARK(''),
        { method: 'PATCH' },
        { BOOKMARK_PAGE_DB: mockD1Database as D1Database },
      )

      expect(res.status).toBe(404)
      expect(res.statusText).toBe('')
    })
  })

  describe('異常系(500): ', () => {
    it('データベースのバインディング（BOOKMARK_PAGE_DB）が未設定の場合、500を返すこと', async () => {
      const res = await app.request(
        REQUEST_API_PATH.UPDATE_BOOKMARK(updateBookmark.id),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
        {},
      )

      expect(res.status).toBe(500)

      const body = await res.json()
      expect(body).toEqual({
        success: false,
        error: UI_MESSAGES.API.DB_ERROR,
      })
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(ERROR_MESSAGE.DB_BINDING_ERROR(DATABASE_NAME)),
      )
    })

    it('データベースの更新エラーの場合', async () => {
      const dbError = new Error(ERROR_MESSAGE.FAILED_UPDATE_BOOKMARK)
      mockFirst.mockRejectedValueOnce(dbError)

      const mockD1Database: Partial<D1Database> = {
        prepare: mockPrepare as D1Database['prepare'],
      }

      const res = await app.request(
        REQUEST_API_PATH.UPDATE_BOOKMARK(updateBookmark.id),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
        {
          BOOKMARK_PAGE_DB: mockD1Database as D1Database,
        },
      )

      expect(res.status).toBe(500)

      const body = await res.json()
      expect(body).toEqual({
        success: false,
        error: UI_MESSAGES.API.DB_ERROR,
      })
      expect(consoleSpy).toHaveBeenCalledWith(LOG_MESSAGE.DB_ERROR(dbError))
    })
  })

  describe('異常系(409): ', () => {
    it('登録済みのurlを指定した場合にステータス409を返すこと', async () => {
      // 💡 D1 (SQLite) が UNIQUE 制約違反エラーを投げた状況をシミュレート
      const firstSpy = vi
        .fn()
        .mockRejectedValue(new Error(TEST_ERROR_MESSAGE.CONSTRAINT_ERROR))
      const bindSpy = vi.fn().mockReturnValue({ first: firstSpy })
      const prepareSpy = vi.fn().mockReturnValue({ bind: bindSpy })

      const mockD1Database: Partial<D1Database> = {
        prepare: prepareSpy as D1Database['prepare'],
      }

      const res = await app.request(
        REQUEST_API_PATH.UPDATE_BOOKMARK(updateBookmark.id),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
        {
          BOOKMARK_PAGE_DB: mockD1Database as D1Database,
        },
      )

      // 💡 409 Conflict の検証
      expect(res.status).toBe(409)

      const body = await res.json()
      expect(body).toEqual({
        success: false,
        error: UI_MESSAGES.API.DUPLICATE_URL,
      })
      expect(consoleSpy).not.toHaveBeenCalled()
    })
  })
})
