import { UI_MESSAGES } from '@shared/constants'
import type { Bookmark } from '@shared/schemas/bookmark'

export type BookmarkProps = {
  bookmarks: Bookmark[]
  isLoading: boolean
  error: null | string | Error
  selectedId: string | null
  onRowClick: (id: string) => void
  onDoubleClick: (id: string, url: string) => void
}

export const BookmarkList = ({
  bookmarks,
  isLoading,
  error,
  selectedId,
  onRowClick,
  onDoubleClick,
}: BookmarkProps) => {
  if (isLoading) {
    return (
      <div
        className="flex justify-center items-center p-8"
        role="status"
        aria-label={UI_MESSAGES.LOADING_LABEL}
      >
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200"
        role="alert"
      >
        {UI_MESSAGES.ERROR_PREFIX}:{' '}
        {error instanceof Error ? error.message : UI_MESSAGES.UNEXPECTED_ERROR}
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        {UI_MESSAGES.NO_BOOKMARKS}
      </div>
    )
  }

  const trClassName = `transition-colors cursor-pointer hover:bg-blue-200 bg-blue-100 text-sm text-left text-gray-900 select-none`

  return (
    <div className="w-full max-w-2xl mx-auto overflow-hidden bg-white shadow border-t border-l border-r border-blue-700">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50"></thead>
        <tbody className="bg-white">
          {bookmarks.map((bookmark) => {
            const tdClassName = `px-2 py-1 whitespace-nowrap border-b border-blue-700 ${
              selectedId === bookmark.id ? 'font-bold' : ''
            }`

            return (
              <tr
                key={bookmark.id}
                className={trClassName}
                tabIndex={0}
                aria-selected={selectedId === bookmark.id}
                onClick={() => onRowClick(bookmark.id)}
                onDoubleClick={() => onDoubleClick(bookmark.id, bookmark.url)}
                onKeyDown={(e) => {
                  // EnterキーでURLを開く (ダブルクリック相当)
                  if (e.key === 'Enter') {
                    onDoubleClick(bookmark.id, bookmark.url)
                  } else if (e.key === ' ') {
                    // スペースキーで選択/解除 (クリック相当)
                    e.preventDefault() // ページのスクロールを防止
                    onRowClick(bookmark.id)
                  }
                }}
              >
                <td className={tdClassName}>{bookmark.title}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
