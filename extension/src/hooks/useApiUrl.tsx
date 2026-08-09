import { useEffect, useState } from 'react'
import { ZodError } from 'zod'

import { type MessageBarType } from '../../../shared/components/MessageBar'
import {
  DEFAULT_API_URL,
  TIMEOUT_MILLISECOND,
} from '../../../shared/constants/api'
import {
  ERROR_MESSAGE,
  UI_MESSAGES,
} from '../../../shared/constants/uiMessages'
import { createErrorMessage, validateUrl } from '../../../shared/lib/utils'
import { STORAGE_KEY } from '../../constants/storage'
import { createClient } from '../lib/hono'

export const useApiUrl = () => {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL)

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

  const saveApiUrl = async (): Promise<MessageBarType> => {
    try {
      const validApiUrl = validateUrl(apiUrl)
      if (!validApiUrl.success) {
        return createErrorMessage(validApiUrl.error.issues[0].message)
      }
      if (globalThis.chrome?.storage?.local) {
        await globalThis.chrome.storage.local.set({
          [STORAGE_KEY.API_URL]: validApiUrl.data,
        })
        return { text: UI_MESSAGES.API.SAVED_API_URL, type: 'success' }
      }
      return createErrorMessage(UI_MESSAGES.API.FAILED_SAVE_API_URL)
    } catch (error) {
      console.error(error)
      return createErrorMessage(UI_MESSAGES.API.FAILED_SAVE_API_URL)
    }
  }

  const testConnection = async (): Promise<MessageBarType> => {
    try {
      let client
      try {
        client = createClient({ apiUrl, timeoutMs: TIMEOUT_MILLISECOND })
      } catch (error) {
        if (error instanceof ZodError) {
          return createErrorMessage(error.issues[0].message)
        }
        throw error
      }

      const response = await client.api.bookmarks.$get()

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return createErrorMessage(UI_MESSAGES.AUTH.ZERO_TRUST_AUTH_ERROR)
        }
        throw new Error(ERROR_MESSAGE.STATUS_CODE(response.status))
      }

      const data = await response.json()

      if (!data || !data.success || !Array.isArray(data.data)) {
        return createErrorMessage(UI_MESSAGES.AUTH.INVALID_RESPONSE)
      }

      return {
        text: UI_MESSAGES.BOOKMARKS.REGISTERED_BOOKMARKS(data.data.length),
        type: 'success',
      }
    } catch (error) {
      let errorMessage: string = UI_MESSAGES.API.FAILED_CONNECT_SERVER

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = UI_MESSAGES.API.TIMEOUT_CONNECT_SERVER
        } else {
          console.error(error.message)
        }
      }
      return createErrorMessage(errorMessage)
    }
  }

  return { apiUrl, saveApiUrl, setApiUrl, testConnection }
}
