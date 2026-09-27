import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hc } from 'hono/client'

import { AppType } from '../../../functions/api/[[route]]'
import { UnassignRelationParam } from '../../../functions/schemas/relations'
import { ERROR_MESSAGE } from '../../../shared/constants/uiMessages'
import { showErrorMessage } from '../../lib/notification'

const client = hc<AppType>('/')

export const useUnassignRelation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ bookmark_id, keyword_id }: UnassignRelationParam) => {
      const res = await client.api.bookmarks[':bookmark_id'].keywords[
        ':keyword_id'
      ].$delete({
        param: { bookmark_id, keyword_id },
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || ERROR_MESSAGE.FAILED_UNASSIGN_RELATION)
      }

      return
    },
    onError: (error) => {
      showErrorMessage(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
      queryClient.invalidateQueries({ queryKey: ['keywords'] })
    },
  })
}
