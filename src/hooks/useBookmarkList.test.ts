import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useBookmarkList } from './useBookmarkList'

describe('useBookmarkList', () => {
  beforeEach(() => {
    vi.stubGlobal('open', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  type TestCase = {
    name: string
    url: string
    expectedCalled: boolean
  }

  const testCases: TestCase[] = [
    {
      name: '有効な HTTP URL の場合に新しいタブで開かれること',
      url: 'http://example.com',
      expectedCalled: true,
    },
    {
      name: '有効な HTTPS URL の場合に新しいタブで開かれること',
      url: 'https://example.com',
      expectedCalled: true,
    },
    {
      name: 'javascript: スキームの場合は実行されないこと',
      url: 'javascript:alert(1)',
      expectedCalled: false,
    },
    {
      name: 'プロトコルのない文字列の場合は実行されないこと',
      url: 'example.com',
      expectedCalled: false,
    },
    {
      name: '不正な形式の文字列の場合は実行されないこと',
      url: 'not-a-url',
      expectedCalled: false,
    },
  ]

  it.each(testCases)('$name', ({ url, expectedCalled }) => {
    const { result } = renderHook(() => useBookmarkList())

    result.current.handleDoubleClick(url)

    if (expectedCalled) {
      expect(window.open).toHaveBeenCalledWith(
        url,
        '_blank',
        'noopener,noreferrer',
      )
    } else {
      expect(window.open).not.toHaveBeenCalled()
    }
  })
})