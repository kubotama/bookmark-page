import { describe, it, expect, vi } from 'vitest'
import { app } from './[[route]]'
import type { D1Database } from '@cloudflare/workers-types'
import { BOOKMARKS } from '../constants/db'
import {
  BookmarksTableData,
  getExpectedText,
  INVALID_STRING,
  TEST_ERROR_MESSAGE,
} from '../test/fixtures'
import { CreateBookmarkSchema } from '../schemas/bookmark'
import { LOG_MESSAGE } from '../constants/logMessage'

describe('Hono API - POST /api/bookmarks', () => {
  it('正常系: 有効なパラメータを送信したとき、ブックマークが登録され201を返すこと', async () => {
    const firstSpy = vi.fn().mockResolvedValue(BookmarksTableData)
    const bindSpy = vi.fn().mockReturnValue({ first: firstSpy })
    const prepareSpy = vi.fn().mockReturnValue({ bind: bindSpy })

    // Partial を使って as any を排除した型安全なモックDB
    const mockD1Database: Partial<D1Database> = {
      prepare: prepareSpy as D1Database['prepare'],
    }

    // 💡 2. テスト対象の POST リクエストデータを用意
    const requestBody = {
      title: BookmarksTableData.title,
      url: BookmarksTableData.url,
    }

    // 💡 3. Hono にリクエストを投げる
    const res = await app.request(
      '/api/bookmarks',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
        name: 'タイトル',
        invalidBody: {
          title: '',
          url: BookmarksTableData.url,
        },
        invalidName: 'title',
      },
      {
        name: 'url',
        invalidBody: {
          title: BookmarksTableData.title,
          url: INVALID_STRING.URL,
        },
        invalidName: 'url',
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
          '/api/bookmarks',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invalidBody),
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
    it('異常系: データベースへのインサート（または再取得）が失敗したとき、ステータス500を返すこと', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
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
        '/api/bookmarks',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validBody),
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
  })
})
