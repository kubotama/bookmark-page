import { useQuery } from '@tanstack/react-query'
import { hc } from 'hono/client'

import { AppType } from '../../functions/api/[[route]]'
import { ERROR_MESSAGE } from '../../shared/constants/uiMessages'

const client = hc<AppType>('/')

export const useKeywords = () => {
  return useQuery({
    queryFn: async () => {
      const res = await client.api.keywords.$get()
      if (!res.ok) {
        throw new Error(ERROR_MESSAGE.SERVER_ERROR)
      }
      return await res.json() // { success: true, data: [...] }
    },
    queryKey: ['keywords'],
  })
}
