import { useCallback, useState } from 'react'
import { isHttpUrl } from '@shared/utils/url'

export const useBookmarkList = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  /**
   * ブックマーク行をクリックした際のハンドラ (選択/解除のトグル)
   */
  const handleRowClick = useCallback(
    (id: string) => {
      setSelectedId((prev) => (prev === id ? null : id))
    },
    [setSelectedId],
  )

  /**
   * ブックマークをダブルクリックした際のハンドラ
   */
  const handleDoubleClick = useCallback((url: string) => {
    if (isHttpUrl(url)) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }, [])

  return {
    selectedId,
    handleRowClick,
    handleDoubleClick,
  }
}