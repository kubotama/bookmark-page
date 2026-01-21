import { useQuery } from '@tanstack/react-query'
import { client } from '../lib/api'

export const BookmarkList = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const res = await client.api.bookmarks.$get()
      if (!res.ok) {
        throw new Error('Failed to fetch bookmarks')
      }
      return await res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
        エラーが発生しました: {error.message}
      </div>
    )
  }

  const bookmarks = data?.bookmarks ?? []

  if (bookmarks.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        ブックマークがありません。
      </div>
    )
  }

  return (
    <ul className="space-y-3 w-full max-w-2xl mx-auto">
      {bookmarks.map((bookmark) => (
        <li
          key={bookmark.id}
          className="p-4 bg-white shadow rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
        >
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <h3 className="font-semibold text-lg text-blue-600 group-hover:underline">
              {bookmark.title}
            </h3>
            <p className="text-sm text-gray-500 truncate">{bookmark.url}</p>
          </a>
        </li>
      ))}
    </ul>
  )
}
