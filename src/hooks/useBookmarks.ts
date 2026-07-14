// src/hooks/useBookmarks.ts
import { useQuery } from '@tanstack/react-query'
import { hc } from 'hono/client'
import { AppType } from '../../functions/api/[[route]]'
import { ERROR_MESSAGE } from '../../shared/constants/uiMessages'

const client = hc<AppType>('/')

// 💡 ブックマーク全件を取得するカスタムフック
export function useBookmarks() {
  return useQuery({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const res = await client.api.bookmarks.$get()
      if (!res.ok) {
        throw new Error(ERROR_MESSAGE.SERVER_ERROR)
      }
      return await res.json() // { success: true, data: [...] }
    },
  })
}

// 💡 保持しているキャッシュ（全件）の中から、特定のIDのブックマークを1件だけ抽出するフック
export function useBookmarkById(id: string) {
  // 全件取得のフックを再利用（すでにキャッシュがあればAPIリクエストは飛ばない！）
  const { data: resJson, isLoading, error } = useBookmarks()

  const bookmarks = resJson?.data ?? []
  // 配列からIDが一致するものを探す
  const bookmark = bookmarks.find((b) => b.id === id)

  return {
    bookmark,
    isLoading,
    error,
  }
}
