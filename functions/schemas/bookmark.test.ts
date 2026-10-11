import { uuidv7 } from 'uuidv7'
import { describe, expect, it } from 'vitest'

import { TEST_STRING, TestKeywords } from '../test/fixtures'
import { BookmarkWithKeywordsSchema } from './bookmark'
import { Keyword } from './keyword'

describe('BookmarkWithKeywordsSchema', () => {
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
