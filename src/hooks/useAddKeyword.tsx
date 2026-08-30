import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hc } from 'hono/client'

import { AppType } from '../../functions/api/[[route]]'
import { CreateKeywordInput } from '../../functions/schemas/keyword'
import { ERROR_MESSAGE } from '../../shared/constants/uiMessages'
import { showErrorMessage } from '../lib/notification'

const client = hc<AppType>('/')

export const useAddKeyword = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ bookmark_id, name }: CreateKeywordInput) => {
      const res = await client.api.keywords.$post({
        json: { bookmark_id, name },
      })

      const json = await res.json()
      if (!json.success) {
        throw new Error(json.error || ERROR_MESSAGE.FAILED_ADD_KEYWORD)
      }

      return json
    },
    onError: (error) => {
      showErrorMessage(error.message)
      queryClient.invalidateQueries({ queryKey: ['keywords'] })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
      queryClient.invalidateQueries({ queryKey: ['keywords'] })
    },
  })
}
