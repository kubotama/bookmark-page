import { uuidv7 } from 'uuidv7'
import { describe, expect, it } from 'vitest'

import { TEST_STRING, TestBookmarks } from '../test/fixtures'
import { KeywordWithBookmarkIdsSchema } from './keyword'

describe('KeywordWithBookmarkIdsSchema', () => {
  it('正常なbookmark_ids', () => {
    const keywordId = uuidv7()
    const bookmark_ids = [TestBookmarks[0].id, TestBookmarks[1].id]

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
