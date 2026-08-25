import { D1Database } from '@cloudflare/workers-types'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'

import { ERROR_MESSAGE, UI_MESSAGES } from '../../shared/constants/uiMessages'
import { SCHEMA_MESSAGE } from '../../shared/constants/validation'
import { BOOKMARKS_KEYWORDS, DATABASE_NAME, KEYWORDS } from '../constants/db'
import { CreateKeywordInput } from '../schemas/keyword'
import {
  REQUEST_API_PATH,
  TEST_ERROR_MESSAGE,
  TestBookmarks,
  TestKeywords,
  TestKeywordsTableData,
  TestUuid,
} from '../test/fixtures'
import { app } from './[[route]]'

describe('Hono API - POST /keywords', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const addedKeyword = TestKeywords[0]

  it('指定した名前でキーワードを作成できること', async () => {
    const requestBody = {
      name: addedKeyword.name,
    }
    const firstSpy = vi.fn().mockResolvedValue(TestKeywordsTableData[0])
    const bindSpy = vi.fn().mockReturnValue({ first: firstSpy })
    const prepareSpy = vi.fn().mockReturnValue({ bind: bindSpy })

    const mockD1Database: Partial<D1Database> = {
      prepare: prepareSpy as D1Database['prepare'],
    }

    const res = await app.request(
      REQUEST_API_PATH.ADD_KEYWORD,
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
    expect(json.data.name).toBe(addedKeyword.name)
    expect(json.data.id).toBeDefined()

    expect(prepareSpy).toHaveBeenCalledWith(KEYWORDS.INSERT)
  })

  it('bookmark_id を指定した場合、キーワードを作成して指定したブックマークに関連付けられること', async () => {
    const targetBookmarkId = TestBookmarks[0].id
    const newKeywordData = TestKeywordsTableData[0]
    const newRelationData = {
      bookmark_id: targetBookmarkId,
      id: TestUuid,
      keyword_id: newKeywordData.id,
    }

    const requestBody = {
      bookmark_id: targetBookmarkId,
      name: newKeywordData.name,
    }

    // 💡 1. 実行される SQL に応じて戻り値を切り替える D1 モック
    const prepareSpy = vi.fn((sql: string) => {
      if (sql === KEYWORDS.INSERT) {
        return {
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(newKeywordData),
          }),
        }
      }
      if (sql === BOOKMARKS_KEYWORDS.INSERT) {
        return {
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(newRelationData),
          }),
        }
      }
      return { bind: vi.fn().mockReturnValue({ first: vi.fn() }) }
    })
    const mockD1Database: Partial<D1Database> = {
      prepare: prepareSpy as unknown as D1Database['prepare'],
    }

    // 💡 2. API を呼び出し
    const res = await app.request(
      REQUEST_API_PATH.ADD_KEYWORD,
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

    // 💡 3. ステータスコードとレスポンス内容の検証
    expect(res.status).toBe(201)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.name).toBe(newKeywordData.name)
    expect(json.data.id).toBe(newKeywordData.id)
    // 関連付けられた bookmark_ids が配列で含まれていること
    expect(json.data.bookmark_ids).toEqual([targetBookmarkId])

    // 💡 4. キーワード登録と中間テーブル登録の SQL が両方呼ばれたことを検証
    expect(prepareSpy).toHaveBeenCalledWith(KEYWORDS.INSERT)
    expect(prepareSpy).toHaveBeenCalledWith(BOOKMARKS_KEYWORDS.INSERT)
  })

  describe('エラーのテスト', () => {
    let consoleSpy: Mock<(...data: unknown[]) => void>
    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    it('キーワードの名前が不正な場合', async () => {
      const requestBody = { name: '' }
      const firstSpy = vi.fn()
      const bindSpy = vi.fn().mockReturnValue({ first: firstSpy })
      const prepareSpy = vi.fn().mockReturnValue({ bind: bindSpy })

      const mockD1Database: Partial<D1Database> = {
        prepare: prepareSpy as unknown as D1Database['prepare'],
      }

      const res = await app.request(
        REQUEST_API_PATH.ADD_KEYWORD,
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

      expect(res.status).toBe(400)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error).toBe(SCHEMA_MESSAGE.MIN_LENGTH_KEYWORD)
    })

    it('データベースのバインディング（BOOKMARK_PAGE_DB）が未設定の場合、500を返すこと', async () => {
      const requestBody = { name: addedKeyword.name }

      const res = await app.request(
        REQUEST_API_PATH.ADD_KEYWORD,
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

    type TestCase = {
      description: string
      expectedMessage: string
      prepareSpy: Mock
      requestBody: CreateKeywordInput
    }

    const testCases: TestCase[] = [
      {
        description: 'キーワードの登録',
        expectedMessage: expect.stringContaining(
          ERROR_MESSAGE.INSERT_KEYWORD_ERROR,
        ),
        prepareSpy: vi.fn().mockReturnValue({
          bind: vi
            .fn()
            .mockReturnValue({ first: vi.fn().mockResolvedValue(undefined) }),
        }),
        requestBody: { name: addedKeyword.name },
      },
      {
        description: 'ブックマークとキーワードの関連付け',
        expectedMessage: expect.stringContaining(
          ERROR_MESSAGE.INSERT_BKRELATION_ERROR,
        ),
        prepareSpy: vi.fn((sql: string) => {
          if (sql === KEYWORDS.INSERT) {
            return {
              bind: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(TestKeywordsTableData[0]),
              }),
            }
          }
          if (sql === BOOKMARKS_KEYWORDS.INSERT) {
            return {
              bind: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(undefined),
              }),
            }
          }
          return { bind: vi.fn().mockReturnValue({ first: vi.fn() }) }
        }),
        requestBody: {
          bookmark_id: TestBookmarks[0].id,
          name: TestKeywordsTableData[0].name,
        },
      },
    ]

    it.each(testCases)(
      '$description がエラーの場合',
      async ({ expectedMessage, prepareSpy, requestBody }) => {
        const mockD1Database: Partial<D1Database> = {
          prepare: prepareSpy as unknown as D1Database['prepare'],
        }

        const res = await app.request(
          REQUEST_API_PATH.ADD_KEYWORD,
          {
            body: JSON.stringify(requestBody),
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
        expect(consoleSpy).toHaveBeenCalledWith(expectedMessage)
      },
    )
  })
})
