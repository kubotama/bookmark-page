import { useQuery } from '@tanstack/react-query'
import { client } from '../lib/api'
import { UI_MESSAGES } from '@shared/constants'
import { bookmarkKeys } from '../lib/queryKeys'

const fetchBookmarks = async () => {
  const res = await client.api.bookmarks.$get()
  if (!res.ok) {
    throw new Error(UI_MESSAGES.FETCH_FAILED)
  }
  return await res.json()
}

export const useBookmarks = () => {
  return useQuery({
    queryKey: bookmarkKeys.lists(),
    queryFn: fetchBookmarks,
  })
}
