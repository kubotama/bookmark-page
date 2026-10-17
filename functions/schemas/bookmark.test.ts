import { uuidv7 } from 'uuidv7'
import { describe, expect, it } from 'vitest'

import { SCHEMA_MESSAGE } from '../../shared/constants/validation'
import { INVALID_STRING, TEST_STRING, TestKeywords } from '../test/fixtures'
import { BookmarkWithKeywordsSchema } from './bookmark'
import { Keyword } from './keyword'

describe('BookmarkWithKeywordsSchema', () => {
  describe('正常系', () => {
    type TestCase = {
      keywords: Keyword[]
      testName: string
    }

    const testCases: TestCase[] = [
      { keywords: TestKeywords, testName: '正常なkeywords' },
      { keywords: [], testName: 'キーワードなし' },
    ]

    it.each(testCases)(`$testName`, ({ keywords }) => {
      const bookmarkId = uuidv7()

      const testBookmark = {
        id: bookmarkId,
        keywords: JSON.stringify(keywords),
        title: TEST_STRING.NEW_BOOKMARK,
        url: TEST_STRING.URL,
      }

      const schemaResult = BookmarkWithKeywordsSchema.safeParse(testBookmark)

      expect(schemaResult.success).toBe(true)

      if (schemaResult.success) {
        expect(schemaResult.data).toMatchObject({
          id: testBookmark.id,
          keywords: keywords.map(({ id, name }) => ({ id, name })),
          title: testBookmark.title,
          url: testBookmark.url,
        })
      }
    })
  })

  describe('エラーのテスト', () => {
    type TestCase = {
      keywords: unknown
      message?: string
      testName: string
    }

    const testCases: TestCase[] = [
      {
        keywords: INVALID_STRING.ID,
        message: SCHEMA_MESSAGE.INVALID_KEYWORDS,
        testName: '不正なJSON形式',
      },
      {
        keywords: [1, 2],
        testName: '配列そのものを渡した場合',
      },
      {
        keywords: null,
        testName: 'null',
      },
      {
        keywords: JSON.stringify({}),
        testName: '配列ではないJSON',
      },
      {
        keywords: JSON.stringify([1, 2]),
        testName: 'JSON形式の数値の配列',
      },
    ]

    it.each(testCases)(`$testName`, ({ keywords, message }) => {
      const bookmarkId = uuidv7()
      const testBookmark = {
        id: bookmarkId,
        keywords,
        title: TEST_STRING.NEW_BOOKMARK,
        url: TEST_STRING.URL,
      }

      const schemaResult = BookmarkWithKeywordsSchema.safeParse(testBookmark)
      expect(schemaResult.success).toBe(false)
      if (!schemaResult.success && message !== undefined) {
        expect(schemaResult.error.issues[0].message).toBe(message)
      }
    })
  })
})
