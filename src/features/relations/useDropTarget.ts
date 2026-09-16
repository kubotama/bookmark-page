import { DragEvent, useCallback, useRef, useState } from 'react'

export const useDropTarget = () => {
  const [isOverAssigned, setIsOverAssigned] = useState(false) // 💡 ドロップ領域上にドラッグ中かの判定
  const dragCount = useRef(0) // 子要素への侵入によるチラつきを防ぐカウンター

  // 💡 ドロップ受け入れの許可（必須）
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDragEnter = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    dragCount.current += 1
    if (dragCount.current === 1) {
      setIsOverAssigned(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    dragCount.current -= 1
    if (dragCount.current === 0) {
      setIsOverAssigned(false)
    }
  }, [])

  const handleDrop = useCallback(
    (
      e: DragEvent<HTMLElement>,
      onDropId: (droppedId: string) => void, // 💡 単にドロップされたIDを返すコールバック
      format = 'text/plain',
    ) => {
      e.preventDefault()
      dragCount.current = 0
      setIsOverAssigned(false)

      const droppedId = e.dataTransfer.getData(format)
      if (droppedId) {
        onDropId(droppedId)
      }
    },
    [],
  )

  return {
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    isOverAssigned,
  }
}
