import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hc } from 'hono/client'

import { AppType } from '../../../functions/api/[[route]]'
import { AssignRelationPayload } from '../../../functions/schemas/relations'
import { ERROR_MESSAGE } from '../../../shared/constants/uiMessages'
import { showErrorMessage } from '../../lib/notification'

const client = hc<AppType>('/')

export const useAssignRelation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ bookmark_id, keyword_id }: AssignRelationPayload) => {
      const res = await client.api.bookmarks[':bookmark_id'].keywords.$post({
        json: { keyword_id },
        param: { bookmark_id },
      })

      const json = await res.json()
      if (!json.success) {
        throw new Error(json.error || ERROR_MESSAGE.FAILED_ASSIGN_RELATION)
      }

      return json
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
