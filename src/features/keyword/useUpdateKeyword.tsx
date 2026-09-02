import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hc } from 'hono/client'

import { AppType } from '../../../functions/api/[[route]]'
import { UpdateKeywordPayload } from '../../../functions/schemas/keyword'
import { ERROR_MESSAGE } from '../../../shared/constants/uiMessages'
import { showErrorMessage } from '../../lib/notification'

const client = hc<AppType>('/')

export const useUpdateKeyword = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, name }: UpdateKeywordPayload) => {
      const res = await client.api.keywords[':id'].$patch({
        json: { name },
        param: { id },
      })

      const json = await res.json()
      if (!json.success) {
        throw new Error(json.error || ERROR_MESSAGE.FAILED_UPDATE_KEYWORD)
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
