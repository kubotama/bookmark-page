import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useBookmarkList } from './useBookmarkList'
import { MOCK_BOOKMARK_1, MOCK_BOOKMARK_2, INVALID_URLS } from '@shared/test/fixtures'

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
      url: INVALID_URLS.JAVASCRIPT,
      expectedCalled: false,
    },
    {
      name: 'プロトコルのない文字列の場合は実行されないこと',
      url: INVALID_URLS.NO_PROTOCOL,
      expectedCalled: false,
    },
    {
      name: '不正な形式の文字列の場合は実行されないこと',
      url: INVALID_URLS.MALFORMED,
      expectedCalled: false,
    },
  ]

  it.each(testCases)('$name', ({ url, expectedCalled }) => {
    const { result } = renderHook(() => useBookmarkList())

    act(() => {
      result.current.handleDoubleClick(MOCK_BOOKMARK_1.id, url)
    })

    expect(result.current.selectedId).toBe(MOCK_BOOKMARK_1.id)

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

  describe('selectedId / handleRowClick', () => {
    it('初期状態では何も選択されていないこと', () => {
      const { result } = renderHook(() => useBookmarkList())
      expect(result.current.selectedId).toBeNull()
    })

    it('handleRowClick を呼ぶと ID が選択されること', () => {
      const { result } = renderHook(() => useBookmarkList())

      act(() => {
        result.current.handleRowClick(MOCK_BOOKMARK_1.id)
      })

      expect(result.current.selectedId).toBe(MOCK_BOOKMARK_1.id)
    })

    it('同じ ID で再度 handleRowClick を呼ぶと選択が解除されること', () => {
      const { result } = renderHook(() => useBookmarkList())

      act(() => {
        result.current.handleRowClick(MOCK_BOOKMARK_1.id)
      })
      expect(result.current.selectedId).toBe(MOCK_BOOKMARK_1.id)

      act(() => {
        result.current.handleRowClick(MOCK_BOOKMARK_1.id)
      })
      expect(result.current.selectedId).toBeNull()
    })

    it('別の ID で handleRowClick を呼ぶと選択が切り替わること', () => {
      const { result } = renderHook(() => useBookmarkList())

      act(() => {
        result.current.handleRowClick(MOCK_BOOKMARK_1.id)
      })
      act(() => {
        result.current.handleRowClick(MOCK_BOOKMARK_2.id)
      })

      expect(result.current.selectedId).toBe(MOCK_BOOKMARK_2.id)
    })

    it('setSelectedId を直接呼んで選択状態を変更できること', () => {
      const { result } = renderHook(() => useBookmarkList())

      act(() => {
        result.current.setSelectedId(MOCK_BOOKMARK_1.id)
      })
      expect(result.current.selectedId).toBe(MOCK_BOOKMARK_1.id)

      act(() => {
        result.current.setSelectedId(null)
      })
      expect(result.current.selectedId).toBeNull()
    })
  })
})
