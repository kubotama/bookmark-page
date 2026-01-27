import { describe, it, expect } from 'vitest'
import {
  bookmarkSchema,
  createBookmarkSchema,
  updateBookmarkSchema,
} from './bookmark'
import { MOCK_BOOKMARK_1, INVALID_URLS } from '../test/fixtures'
import { VALIDATION_MESSAGES } from '../constants'

describe('bookmarkSchema', () => {
  it.each([
    { name: 'HTTP URL', url: 'http://example.com' },
    { name: 'HTTPS URL', url: 'https://example.com' },
  ])('有効な $name を受け入れること', ({ url }) => {
    const valid = { ...MOCK_BOOKMARK_1, url }
    const result = bookmarkSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('javascript: スキームを拒否し、正しいメッセージを返すこと', () => {
    const invalid = { ...MOCK_BOOKMARK_1, url: INVALID_URLS.JAVASCRIPT }
    const result = bookmarkSchema.safeParse(invalid)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        VALIDATION_MESSAGES.URL_INVALID_PROTOCOL,
      )
    }
  })
})

describe('createBookmarkSchema', () => {
  it('正常なデータを受け入れること', () => {
    const valid = { title: 'Test', url: 'https://example.com' }
    expect(createBookmarkSchema.safeParse(valid).success).toBe(true)
  })

  it.each([
    {
      name: 'タイトルが空',
      data: { title: '', url: 'https://example.com' },
      expected: VALIDATION_MESSAGES.TITLE_REQUIRED,
    },
    {
      name: 'URL 形式が不正',
      data: { title: 'Test', url: 'not-a-url' },
      expected: VALIDATION_MESSAGES.URL_INVALID_FORMAT,
    },
    {
      name: 'プロトコルが不正 (ftp)',
      data: { title: 'Test', url: 'ftp://example.com' },
      expected: VALIDATION_MESSAGES.URL_INVALID_PROTOCOL,
    },
  ])('異常系: $name の場合に正しいエラーを返すこと', ({ data, expected }) => {
    const result = createBookmarkSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(expected)
    }
  })
})

describe('updateBookmarkSchema', () => {
  it.each([
    { name: 'タイトルのみ', data: { title: 'Updated' } },
    { name: 'URLのみ', data: { url: 'https://example.com' } },
    { name: '両方', data: { title: 'Updated', url: 'https://example.com' } },
  ])('正常系: $name の場合に成功すること', ({ data }) => {
    expect(updateBookmarkSchema.safeParse(data).success).toBe(true)
  })

  it.each([
    {
      name: 'タイトルまたは URL の両方が欠落',
      data: {},
      expected: VALIDATION_MESSAGES.UPDATE_MIN_FIELDS,
    },
    {
      name: 'タイトルが空文字',
      data: { title: '' },
      expected: VALIDATION_MESSAGES.TITLE_MIN_LENGTH,
    },
    {
      name: 'URL 形式が不正',
      data: { url: 'not-a-url' },
      expected: VALIDATION_MESSAGES.URL_INVALID_FORMAT,
    },
  ])('異常系: $name の場合に正しいエラーを返すこと', ({ data, expected }) => {
    const result = updateBookmarkSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(expected)
    }
  })
})
