import { describe, it, expect } from 'vitest'
import { bookmarkSchema } from './bookmark'

describe('bookmarkSchema', () => {
  it('有効な HTTP URL を受け入れること', () => {
    const valid = { id: '1', title: 'Test', url: 'http://example.com' }
    expect(bookmarkSchema.safeParse(valid).success).toBe(true)
  })

  it('有効な HTTPS URL を受け入れること', () => {
    const valid = { id: '1', title: 'Test', url: 'https://example.com' }
    expect(bookmarkSchema.safeParse(valid).success).toBe(true)
  })

  it('javascript: スキームを拒否すること', () => {
    const invalid = { id: '1', title: 'Test', url: 'javascript:alert(1)' }
    const result = bookmarkSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('プロトコルのない URL を拒否すること', () => {
    const invalid = { id: '1', title: 'Test', url: 'example.com' }
    const result = bookmarkSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('不正な形式の文字列を拒否すること', () => {
    const invalid = { id: '1', title: 'Test', url: 'not-a-url' }
    const result = bookmarkSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})
