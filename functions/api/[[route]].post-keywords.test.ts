import { D1Database } from '@cloudflare/workers-types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SCHEMA_MESSAGE } from '../../shared/constants/validation'
import { BOOKMARKS_KEYWORDS, KEYWORDS } from '../constants/db'
import {
  REQUEST_API_PATH,
  TestBookmarks,
  TestKeywords,
  TestKeywordsTableData,
  TestUuid,
} from '../test/fixtures'
import { app } from './[[route]]'

describe('Hono API - POST /keywords', () => {
  //   let consoleSpy: Mock<(...data: unknown[]) => void>
  beforeEach(() => {
    vi.resetAllMocks()
    // consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
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
  })
})
