import { uuidv7 } from 'uuidv7'
import { describe, expect, it } from 'vitest'

import { SCHEMA_MESSAGE } from '../../shared/constants/validation'
import { INVALID_STRING, TEST_STRING, TestBookmarks } from '../test/fixtures'
import { KeywordWithBookmarkIdsSchema } from './keyword'

describe('KeywordWithBookmarkIdsSchema', () => {
  describe('正常系', () => {
    type TestCase = {
      bookmark_ids: string[]
      testName: string
    }
    const testCases: TestCase[] = [
      {
        bookmark_ids: [TestBookmarks[0].id, TestBookmarks[1].id],
        testName: '正常なbookmark_ids',
      },
      { bookmark_ids: [], testName: 'bookmark_idsが空' },
    ]
    it.each(testCases)(`$testName`, ({ bookmark_ids }) => {
      const keywordId = uuidv7()

      const testKeyword = {
        bookmark_ids: JSON.stringify(bookmark_ids),
        id: keywordId,
        name: TEST_STRING.NEW_KEYWORD,
      }

      const schemaResult = KeywordWithBookmarkIdsSchema.safeParse(testKeyword)

      expect(schemaResult.success).toBe(true)
      if (schemaResult.success) {
        expect(schemaResult.data).toMatchObject({
          bookmark_ids,
          id: testKeyword.id,
          name: testKeyword.name,
        })
      }
    })
  })
  describe('エラーのテスト', () => {
    type TestCase = {
      bookmark_ids: unknown
      message?: string
      testName: string
    }
    const testCases: TestCase[] = [
      {
        bookmark_ids: INVALID_STRING.ID,
        message: SCHEMA_MESSAGE.INVALID_BOOKMARK_IDS,
        testName: '不正なJSON形式',
      },
      {
        bookmark_ids: [1, 2],
        testName: '数値の配列',
      },
      {
        bookmark_ids: null,
        testName: 'null',
      },
      {
        bookmark_ids: JSON.stringify({}),
        testName: '配列ではないJSON',
      },
      {
        bookmark_ids: JSON.stringify([1, 2]),
        testName: 'JSON形式の数値の配列',
      },
    ]

    it.each(testCases)(`$testName`, ({ bookmark_ids, message }) => {
      const keywordId = uuidv7()
      const testKeyword = {
        bookmark_ids,
        id: keywordId,
        name: TEST_STRING.NEW_KEYWORD,
      }

      const schemaResult = KeywordWithBookmarkIdsSchema.safeParse(testKeyword)
      expect(schemaResult.success).toBe(false)
      if (!schemaResult.success && message !== undefined) {
        expect(schemaResult.error.issues[0].message).toBe(message)
      }
    })
  })
})
