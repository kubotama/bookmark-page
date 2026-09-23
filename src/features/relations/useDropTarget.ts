import { DragEvent, useCallback, useRef, useState } from 'react'

interface UseDropTargetOptions {
  allowedType: string
}

export const useDropTarget = ({ allowedType }: UseDropTargetOptions) => {
  const [isOverAssigned, setIsOverAssigned] = useState(false) // 💡 ドロップ領域上にドラッグ中かの判定
  const dragCount = useRef(0) // 子要素への侵入によるチラつきを防ぐカウンター

  // イベントの DataTransfer に許可された Data Type が含まれているか判定
  const isAllowedType = useCallback(
    (e: React.DragEvent) => {
      return e.dataTransfer.types.includes(allowedType)
    },
    [allowedType],
  )

  // 💡 ドロップ受け入れの許可（必須）
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (isAllowedType(e)) {
        // ドロップを受け入れるために必須
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
      }
    },
    [isAllowedType],
  )

  const handleDragEnter = useCallback(
    (e: DragEvent<HTMLElement>) => {
      if (isAllowedType(e)) {
        e.preventDefault()
        dragCount.current += 1
        if (dragCount.current === 1) {
          setIsOverAssigned(true)
        }
      }
    },
    [isAllowedType],
  )

  const handleDragLeave = useCallback(
    (e: DragEvent<HTMLElement>) => {
      if (isAllowedType(e)) {
        e.preventDefault()
        dragCount.current -= 1
        if (dragCount.current === 0) {
          setIsOverAssigned(false)
        }
      }
    },
    [isAllowedType],
  )

  const handleDrop = useCallback(
    (
      e: DragEvent<HTMLElement>,
      onDropId: (droppedId: string) => void, // 💡 単にドロップされたIDを返すコールバック
    ) => {
      if (!isAllowedType(e)) {
        return
      }

      e.preventDefault()
      dragCount.current = 0
      setIsOverAssigned(false)

      const droppedId = e.dataTransfer.getData(allowedType)
      if (droppedId) {
        onDropId(droppedId)
      }
    },
    [allowedType, isAllowedType],
  )

  return {
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    isOverAssigned,
  }
}
