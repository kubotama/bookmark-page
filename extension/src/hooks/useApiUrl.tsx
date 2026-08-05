import { hc } from 'hono/client'
import { useEffect, useState } from 'react'

import { AppType } from '../../../functions/api/[[route]]'
import {
  DEFAULT_API_URL,
  TIMEOUT_MILLISECOND,
} from '../../../shared/constants/api'
import {
  ERROR_MESSAGE,
  UI_MESSAGES,
} from '../../../shared/constants/uiMessages'
import { validateUrl, ValidationError } from '../../../shared/lib/utils'
import { STORAGE_KEY } from '../../constants/storage'

export const useApiUrl = () => {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL)
  const [apiUrlMessage, setApiUrlMessage] = useState<null | {
    text: string
    type: 'error' | 'success'
  }>(null)

  useEffect(() => {
    if (globalThis.chrome?.storage?.local) {
      globalThis.chrome.storage.local
        .get([STORAGE_KEY.API_URL])
        .then((result) => {
          if (result[STORAGE_KEY.API_URL]) {
            setApiUrl(result[STORAGE_KEY.API_URL])
          }
        })
    }
  }, [])

  const testConnection = async () => {
    setApiUrlMessage(null)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MILLISECOND)

    try {
      const validApiUrl = validateUrl(apiUrl)
      if (!validApiUrl.success) {
        throw new ValidationError(validApiUrl.error.issues[0].message)
      }

      const testClient = hc<AppType>(validApiUrl.data, {
        fetch: (input: RequestInfo | URL, init: RequestInit | undefined) =>
          fetch(input, {
            ...init,
            credentials: 'include',
            signal: controller.signal,
          }),
      })

      const response = await testClient.api.bookmarks.$get()

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(ERROR_MESSAGE.AUTH_ERROR)
        }
        throw new Error(ERROR_MESSAGE.STATUS_CODE(response.status))
      }

      const data = await response.json()

      if (!data || !data.success || !Array.isArray(data.data)) {
        throw new SyntaxError(ERROR_MESSAGE.INVALID_JSON_FORMAT)
      }

      setApiUrlMessage({
        text: UI_MESSAGES.BOOKMARKS.REGISTERED_BOOKMARKS(data.data.length),
        type: 'success',
      })
    } catch (error) {
      let errorMessage: string = UI_MESSAGES.API.FAILED_CONNECT_SERVER

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = UI_MESSAGES.API.TIMEOUT_CONNECT_SERVER
        } else if (error instanceof SyntaxError) {
          errorMessage = UI_MESSAGES.AUTH.INVALID_RESPONSE
        } else if (error instanceof ValidationError) {
          errorMessage = error.message
        } else if (error.message === ERROR_MESSAGE.AUTH_ERROR) {
          errorMessage = UI_MESSAGES.AUTH.ZERO_TRUST_AUTH_ERROR
        } else {
          console.error(error.message)
        }
      }
      setApiUrlMessage({ text: errorMessage, type: 'error' })
    } finally {
      clearTimeout(timeoutId)
    }
  }

  return { apiUrl, apiUrlMessage, setApiUrl, testConnection }
}
