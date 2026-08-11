import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hc } from 'hono/client'

import { AppType } from '../../functions/api/[[route]]'
import { UpdateBookmarkPayload } from '../../functions/schemas/bookmark'
import { ERROR_MESSAGE } from '../../shared/constants/uiMessages'
import { showErrorMessage } from '../lib/notification'

const client = hc<AppType>('/')

export const useUpdateBookmark = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, title, url }: UpdateBookmarkPayload) => {
      const res = await client.api.bookmarks[':id'].$patch({
        json: { title, url },
        param: { id },
      })

      const json = await res.json()
      if (!json.success) {
        throw new Error(json.error || ERROR_MESSAGE.FAILED_UPDATE_BOOKMARK)
      }

      return json
    },
    onError: (error) => {
      showErrorMessage(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })
}
