import { DragEvent, useCallback } from 'react'

export const useDragItem = () => {
  const handleDragStart = useCallback(
    (e: DragEvent<HTMLElement>, id: string, format = 'text/plain') => {
      if (!id) return
      e.dataTransfer.setData(format, id)
    },
    [],
  )

  return { handleDragStart }
}
