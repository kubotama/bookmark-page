import { UI_MESSAGES } from '@shared/constants'
import type { Bookmark } from '@shared/schemas/bookmark'

type Props = {
  bookmarks: Bookmark[]
  isLoading: boolean
  error: unknown
}

export const BookmarkList = ({ bookmarks, isLoading, error }: Props) => {
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

  return (
    <div className="w-full max-w-2xl mx-auto overflow-hidden bg-white shadow border border-blue-700">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50"></thead>
        <tbody className="bg-white">
          {bookmarks.map((bookmark) => (
            <tr
              key={bookmark.id}
              className="hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <td className="px-2 py-1 whitespace-nowrap text-sm font-medium text-gray-900 text-left bg-blue-100 border-b border-blue-700">
                {bookmark.title}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
