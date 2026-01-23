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

  it('handleDoubleClick が呼ばれた際に新しいタブで URL が開かれること', () => {
    const { result } = renderHook(() => useBookmarkList())
    const url = 'https://example.com'

    result.current.handleDoubleClick(url)

    expect(window.open).toHaveBeenCalledWith(
      url,
      '_blank',
      'noopener,noreferrer'
    )
  })

  it('不正な URL の場合は handleDoubleClick が呼ばれても window.open が実行されないこと', () => {
    const { result } = renderHook(() => useBookmarkList())
    const url = 'javascript:alert(1)'

    result.current.handleDoubleClick(url)

    expect(window.open).not.toHaveBeenCalled()
  })
})
