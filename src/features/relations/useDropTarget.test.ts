import { act, renderHook } from '@testing-library/react'
import { DragEvent } from 'react'
import { uuidv7 } from 'uuidv7'
import { describe, expect, it, vi } from 'vitest'

import { useDropTarget } from './useDropTarget'

const createMockDragEvent = (overrides = {}) =>
  ({
    dataTransfer: {
      getData: vi.fn(),
    },
    preventDefault: vi.fn(),
    ...overrides,
  }) as unknown as DragEvent<HTMLElement>

describe('useDropTarget', () => {
  it('初期状態では isOverAssigned が false であること', () => {
    const { result } = renderHook(() => useDropTarget())
    expect(result.current.isOverAssigned).toBe(false)
  })

  it('handleDragEnter が実行されると isOverAssigned が true になること', () => {
    const { result } = renderHook(() => useDropTarget())
    const mockEvent = createMockDragEvent()

    act(() => {
      result.current.handleDragEnter(mockEvent)
    })

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(result.current.isOverAssigned).toBe(true)
  })

  it('handleDragOver が実行されると preventDefault が呼ばれること', () => {
    const { result } = renderHook(() => useDropTarget())
    const mockEvent = createMockDragEvent()

    act(() => {
      result.current.handleDragOver(mockEvent)
    })

    expect(mockEvent.preventDefault).toHaveBeenCalled()
  })

  describe('カウンター制御（子要素侵入時のチラつき防止）', () => {
    it('子要素へ侵入しても（enter 2回）isOverAssigned は true を保持し、すべての要素から離脱（leave 2回）して初めて false になること', () => {
      const { result } = renderHook(() => useDropTarget())
      const mockEvent = createMockDragEvent()

      // 1. 親要素へ進入 (dragCount = 1)
      act(() => {
        result.current.handleDragEnter(mockEvent)
      })
      expect(result.current.isOverAssigned).toBe(true)

      // 2. 子要素へ進入 (dragCount = 2)
      act(() => {
        result.current.handleDragEnter(mockEvent)
      })
      expect(result.current.isOverAssigned).toBe(true)

      // 3. 親要素から離脱 (dragCount = 1)
      act(() => {
        result.current.handleDragLeave(mockEvent)
      })
      expect(result.current.isOverAssigned).toBe(true)

      // 4. 子要素からも完全離脱 (dragCount = 0)
      act(() => {
        result.current.handleDragLeave(mockEvent)
      })
      expect(result.current.isOverAssigned).toBe(false)
    })
  })

  describe('handleDrop', () => {
    const bookmark_id = uuidv7()

    it('ドロップ実行時に preventDefault が呼ばれ、isOverAssigned が false にリセットされ、onDropId コールバックが正しく実行されること', () => {
      const { result } = renderHook(() => useDropTarget())
      const mockOnDropId = vi.fn()

      const mockEvent = createMockDragEvent({
        dataTransfer: {
          getData: vi.fn().mockReturnValue(bookmark_id),
        },
      })

      act(() => {
        result.current.handleDragEnter(mockEvent)
      })
      expect(result.current.isOverAssigned).toBe(true)

      act(() => {
        result.current.handleDrop(mockEvent, mockOnDropId)
      })

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(mockEvent.dataTransfer.getData).toHaveBeenCalledWith('text/plain')
      expect(result.current.isOverAssigned).toBe(false)
      expect(mockOnDropId).toHaveBeenCalledWith(bookmark_id)
    })

    it('dataTransfer からデータが取得できない場合は onDropId が呼ばれないこと', () => {
      const { result } = renderHook(() => useDropTarget())
      const mockOnDropId = vi.fn()
      const mockEvent = createMockDragEvent({
        dataTransfer: {
          getData: vi.fn().mockReturnValue(''),
        },
      })

      act(() => {
        result.current.handleDrop(mockEvent, mockOnDropId)
      })

      expect(mockOnDropId).not.toHaveBeenCalled()
    })
  })
})
