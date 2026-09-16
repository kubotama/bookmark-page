import { renderHook } from '@testing-library/react'
import { DragEvent } from 'react'
import { uuidv7 } from 'uuidv7'
import { describe, expect, it, vi } from 'vitest'

import { useDragItem } from './useDragItem'

const createMockDragEvent = (overrides = {}) =>
  ({
    dataTransfer: {
      setData: vi.fn(),
    },
    ...overrides,
  }) as unknown as DragEvent<HTMLElement>

describe('useDragItem', () => {
  it('id を指定して handleDragStart が実行されると setData が呼ばれること', () => {
    const { result } = renderHook(() => useDragItem())
    const mockEvent = createMockDragEvent()
    const id = uuidv7()

    result.current.handleDragStart(mockEvent, id)

    expect(mockEvent.dataTransfer.setData).toHaveBeenCalledWith(
      'text/plain',
      id,
    )
  })

  it('空文字の id で handleDragStart が実行されると setData が呼ばれないこと', () => {
    const { result } = renderHook(() => useDragItem())
    const mockEvent = createMockDragEvent()

    result.current.handleDragStart(mockEvent, '')

    expect(mockEvent.dataTransfer.setData).not.toHaveBeenCalled()
  })
})
