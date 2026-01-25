import { describe, it, expect } from 'vitest'
import { bookmarkSchema } from './bookmark'
import { MOCK_BOOKMARK_1, INVALID_URLS } from '../test/fixtures'

describe('bookmarkSchema', () => {
  it('有効な HTTP URL を受け入れること', () => {
    const valid = { ...MOCK_BOOKMARK_1, url: 'http://example.com' }
    const result = bookmarkSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('有効な HTTPS URL を受け入れること', () => {
    const result = bookmarkSchema.safeParse(MOCK_BOOKMARK_1)
    expect(result.success).toBe(true)
  })

  it('javascript: スキームを拒否すること', () => {
    const invalid = { ...MOCK_BOOKMARK_1, url: INVALID_URLS.JAVASCRIPT }
    const result = bookmarkSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('プロトコルのない URL を拒否すること', () => {
    const invalid = { ...MOCK_BOOKMARK_1, url: INVALID_URLS.NO_PROTOCOL }
    const result = bookmarkSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('不正な形式の文字列を拒否すること', () => {
    const invalid = { ...MOCK_BOOKMARK_1, url: INVALID_URLS.MALFORMED }
    const result = bookmarkSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})