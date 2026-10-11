import { uuidv7 } from 'uuidv7'
import { describe, expect, it } from 'vitest'

import { TEST_STRING, TestKeywords } from '../test/fixtures'
import { BookmarkWithKeywordsSchema } from './bookmark'

describe('BookmarkWithKeywordsSchema', () => {
  it('正常なkeywords', () => {
    const bookmarkId = uuidv7()
    const keywords = TestKeywords

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
        keywords: TestKeywords.map(({ id, name }) => ({ id, name })),
        title: testBookmark.title,
        url: testBookmark.url,
      })
    }
  })
})
