import type { D1Database } from '@cloudflare/workers-types'

import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'

import { ERROR_MESSAGE, UI_MESSAGES } from '../../shared/constants/uiMessages'
import { BOOKMARKS, DATABASE_NAME } from '../constants/db'
import { LOG_MESSAGE } from '../constants/logMessage'
import { CreateBookmarkSchema } from '../schemas/bookmark'
import {
  BookmarksTableData,
  getExpectedText,
  INVALID_STRING,
  REQUEST_API_PATH,
  TEST_ERROR_MESSAGE,
  TestBookmarks,
} from '../test/fixtures'
import { app } from './[[route]]'

describe('Hono API - POST /api/bookmarks', () => {
  let consoleSpy: Mock<(...data: unknown[]) => void>
  beforeEach(() => {
    vi.resetAllMocks()
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  const updateBookmark = TestBookmarks[0]
  const requestBody = {
    title: updateBookmark.title,
    url: updateBookmark.url,
  }

  it('正常系: 有効なパラメータを送信したとき、ブックマークが登録され201を返すこと', async () => {
    const firstSpy = vi.fn().mockResolvedValue(BookmarksTableData)
    const bindSpy = vi.fn().mockReturnValue({ first: firstSpy })
    const prepareSpy = vi.fn().mockReturnValue({ bind: bindSpy })

    // Partial を使って as any を排除した型安全なモックDB
    const mockD1Database: Partial<D1Database> = {
      prepare: prepareSpy as D1Database['prepare'],
    }

    const res = await app.request(
      REQUEST_API_PATH.ADD_BOOKMARK,
      {
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
      {
        BOOKMARK_PAGE_DB: mockD1Database as D1Database,
      },
    )

    expect(res.status).toBe(201)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.title).toBe(BookmarksTableData.title)
    expect(json.data.url).toBe(BookmarksTableData.url)
    expect(json.data.created_at).toBeDefined()
    expect(json.data.id).toBeDefined()

    expect(prepareSpy).toHaveBeenCalledWith(BOOKMARKS.INSERT)
  })

  describe('Hono API - POST /api/bookmarks (異常系: バリデーション)', () => {
    it.each([
      {
        invalidBody: {
          title: '',
          url: BookmarksTableData.url,
        },
        invalidName: 'title',
        name: 'タイトル',
      },
      {
        invalidBody: {
          title: BookmarksTableData.title,
          url: INVALID_STRING.URL,
        },
        invalidName: 'url',
        name: 'url',
      },
    ])(
      `異常系: $nameが空のとき、ステータス400を返すこと`,
      async ({ invalidBody, invalidName }) => {
        const mockD1Database: Partial<D1Database> = {
          prepare: vi.fn() as unknown as D1Database['prepare'],
        }

        const expectedTitleError = getExpectedText(
          CreateBookmarkSchema,
          invalidBody,
          invalidName,
        )

        const res = await app.request(
          REQUEST_API_PATH.ADD_BOOKMARK,
          {
            body: JSON.stringify(invalidBody),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
          },
          {
            BOOKMARK_PAGE_DB: mockD1Database as D1Database,
          },
        )

        // 💡 400 Bad Request が返ってくることを検証
        expect(res.status).toBe(400)

        const json = await res.json()
        expect(json.success).toBe(false)
        expect(json.error).toBe(expectedTitleError)
      },
    )
  })

  describe('Hono API - POST /api/bookmarks (異常系: データベース)', () => {
    it('異常系: データベースへのインサート（または再取得）で例外が発生したとき、ステータス500を返すこと', async () => {
      const dbError = new Error(TEST_ERROR_MESSAGE.DB_ERROR)

      const firstSpy = vi.fn().mockRejectedValue(dbError)

      const bindSpy = vi.fn().mockReturnValue({ first: firstSpy })
      const prepareSpy = vi.fn().mockReturnValue({ bind: bindSpy })

      // 型安全なモックDBの作成
      const mockD1Database: Partial<D1Database> = {
        prepare: prepareSpy as D1Database['prepare'],
      }

      // パラメータ自体は「正常」なものを送る（バリデーションを通過させるため）
      const validBody = {
        title: BookmarksTableData.title,
        url: BookmarksTableData.url,
      }

      const res = await app.request(
        REQUEST_API_PATH.ADD_BOOKMARK,
        {
          body: JSON.stringify(validBody),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        },
        {
          BOOKMARK_PAGE_DB: mockD1Database as D1Database,
        },
      )

      expect(res.status).toBe(500)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error).toBe(TEST_ERROR_MESSAGE.DB_ERROR)
      expect(consoleSpy).toHaveBeenCalledWith(LOG_MESSAGE.DB_ERROR(dbError))
    })

    it('異常系: データベースへのインサートで再取得できなかったとき、ステータス500を返すこと', async () => {
      const firstSpy = vi.fn().mockResolvedValue(null)
      const bindSpy = vi.fn().mockReturnValue({ first: firstSpy })
      const prepareSpy = vi.fn().mockReturnValue({ bind: bindSpy })

      // 型安全なモックDBの作成
      const mockD1Database: Partial<D1Database> = {
        prepare: prepareSpy as D1Database['prepare'],
      }

      // パラメータ自体は「正常」なものを送る（バリデーションを通過させるため）
      const validBody = {
        title: BookmarksTableData.title,
        url: BookmarksTableData.url,
      }

      const res = await app.request(
        REQUEST_API_PATH.ADD_BOOKMARK,
        {
          body: JSON.stringify(validBody),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        },
        {
          BOOKMARK_PAGE_DB: mockD1Database as D1Database,
        },
      )

      expect(res.status).toBe(500)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error).toBe(TEST_ERROR_MESSAGE.DB_ERROR)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(ERROR_MESSAGE.INSERT_BOOKMARK_ERROR),
      )
    })

    it('登録済みのurlを指定した場合にステータス409を返すこと', async () => {
      // 💡 D1 (SQLite) が UNIQUE 制約違反エラーを投げた状況をシミュレート
      const firstSpy = vi
        .fn()
        .mockRejectedValue(
          new Error(TEST_ERROR_MESSAGE.CONSTRAINT_BOOKMARK_ERROR),
        )
      const bindSpy = vi.fn().mockReturnValue({ first: firstSpy })
      const prepareSpy = vi.fn().mockReturnValue({ bind: bindSpy })

      const mockD1Database: Partial<D1Database> = {
        prepare: prepareSpy as D1Database['prepare'],
      }

      const res = await app.request(
        REQUEST_API_PATH.ADD_BOOKMARK,
        {
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        },
        {
          BOOKMARK_PAGE_DB: mockD1Database as D1Database,
        },
      )

      // 💡 409 Conflict の検証
      expect(res.status).toBe(409)

      const body = await res.json()
      expect(body).toEqual({
        error: UI_MESSAGES.API.DUPLICATE_URL,
        success: false,
      })
      expect(consoleSpy).not.toHaveBeenCalled()
    })

    it('データベースのバインディング（BOOKMARK_PAGE_DB）が未設定の場合、500を返すこと', async () => {
      const res = await app.request(
        REQUEST_API_PATH.ADD_BOOKMARK,
        {
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        },
        {},
      )

      expect(res.status).toBe(500)

      const body = await res.json()
      expect(body).toEqual({
        error: UI_MESSAGES.API.DB_ERROR,
        success: false,
      })
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(ERROR_MESSAGE.DB_BINDING_ERROR(DATABASE_NAME)),
      )
    })
  })
})
