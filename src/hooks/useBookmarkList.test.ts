import { renderHook, act } from '@testing-library/react'
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

  describe('selectedId / handleRowClick', () => {
    it('初期状態では何も選択されていないこと', () => {
      const { result } = renderHook(() => useBookmarkList())
      expect(result.current.selectedId).toBeNull()
    })

    it('handleRowClick を呼ぶと ID が選択されること', () => {
      const { result } = renderHook(() => useBookmarkList())

      const id = '1'

      act(() => {
        result.current.handleRowClick(id)
      })

      expect(result.current.selectedId).toBe(id)
    })

    it('同じ ID で再度 handleRowClick を呼ぶと選択が解除されること', () => {
      const { result } = renderHook(() => useBookmarkList())

      const id = '1'

      act(() => {
        result.current.handleRowClick(id) // 選択
      })

      expect(result.current.selectedId).toBe(id)

      act(() => {
        result.current.handleRowClick(id) // 解除
      })

      expect(result.current.selectedId).toBeNull()
    })

    it('別の ID で handleRowClick を呼ぶと選択が切り替わること', () => {
      const { result } = renderHook(() => useBookmarkList())

      act(() => {
        result.current.handleRowClick('1')
      })

      act(() => {
        result.current.handleRowClick('2')
      })

      expect(result.current.selectedId).toBe('2')
    })
  })
})
