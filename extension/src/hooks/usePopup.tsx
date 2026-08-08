import { hc } from 'hono/client'
import { useEffect, useState } from 'react'

import { AppType } from '../../../functions/api/[[route]]'
import { UI_MESSAGES } from '../../../shared/constants/uiMessages'
import { createErrorMessage, validateUrl } from '../../../shared/lib/utils'

export const usePopup = () => {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')

  // 💡 ポップアップが開いた瞬間にアクティブタブの情報を取得する
  useEffect(() => {
    if (globalThis.chrome?.tabs) {
      globalThis.chrome.tabs.query(
        { active: true, currentWindow: true },
        (tabs) => {
          const activeTab = tabs?.[0]
          if (activeTab) {
            setTitle(activeTab.title || '')
            setUrl(activeTab.url || '')
          }
        },
      )
    }
  }, [])

  const addBookmark = async (apiUrl: string) => {
    try {
      const validApiUrl = validateUrl(apiUrl)
      if (!validApiUrl.success) {
        return createErrorMessage(validApiUrl.error.issues[0].message)
      }

      const client = hc<AppType>(validApiUrl.data, {
        fetch: (input: RequestInfo | URL, init: RequestInit | undefined) =>
          fetch(input, {
            ...init,
            credentials: 'include',
          }),
      })
      const res = await client.api.bookmarks.$post({
        json: { title, url },
      })

      const data = await res.json()

      if (data.success) {
        return {
          text: UI_MESSAGES.BOOKMARKS.ADDED_BOOKMARK,
          type: 'success',
        }
      } else {
        // バックエンド側で整えたバリデーションエラー等のメッセージを表示
        return createErrorMessage(
          data.error || UI_MESSAGES.API.FAILED_CONNECT_SERVER,
        )
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message)
      }
      return createErrorMessage(UI_MESSAGES.API.FAILED_CONNECT_SERVER)
    }
  }

  return { addBookmark, setTitle, setUrl, title, url }
}
