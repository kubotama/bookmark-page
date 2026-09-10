import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { hc } from 'hono/client'

import { AppType } from '../../../functions/api/[[route]]'
import { ERROR_MESSAGE } from '../../../shared/constants/uiMessages'
import { showErrorMessage } from '../../lib/notification'

const client = hc<AppType>('/')

export const useDeleteKeyword = () => {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    // 💡 実際のDELETE APIを呼び出す処理
    mutationFn: async (id: string) => {
      // api.bookmarks[':id'].$delete() という形で型安全に呼び出せます
      const res = await client.api.keywords[':id'].$delete({
        param: { id },
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || ERROR_MESSAGE.FAILED_DELETE_KEYWORD)
      }

      // 204 No Content なのでレスポンスボディは読まずに終了
      return
    },
    onError: (error) => {
      showErrorMessage(error.message)
    },
    // 💡 削除が成功した後の後処理
    onSuccess: () => {
      // 1. ブックマーク一覧のキャッシュを古いものとして扱い、再取得を走らせる
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
      queryClient.invalidateQueries({ queryKey: ['keywords'] })

      // 2. 削除が終わったら、安全に一覧画面（トップなど）へ遷移させる
      router.history.back()
    },
  })
}
