import { useCallback } from 'react'
import { isHttpUrl } from '@shared/utils/url'

export const useBookmarkList = () => {
  /**
   * ブックマークをダブルクリックした際のハンドラ
   */
  const handleDoubleClick = useCallback((url: string) => {
    if (isHttpUrl(url)) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }, [])

  return {
    handleDoubleClick,
  }
}
