import { hc } from 'hono/client'
import { AppType } from '../../functions/api/[[route]]'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ERROR_MESSAGE } from '../../shared/constants/uiMessages'
import { UpdateBookmarkPayload } from '../../functions/schemas/bookmark'

const client = hc<AppType>('/')

export const useUpdateBookmark = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, title, url }: UpdateBookmarkPayload) => {
      const res = await client.api.bookmarks[':id'].$patch({
        param: { id },
        json: { title, url },
      })

      const json = await res.json()
      if (!json.success) {
        throw new Error(json.error || ERROR_MESSAGE.FAILED_UPDATE_BOOKMARK)
      }

      return json
    },
    onSuccess: () => {
      // 1. ブックマーク一覧のキャッシュを古いものとして扱い、再取得を走らせる
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })
}
