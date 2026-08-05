import { useState } from 'react'

import { DEFAULT_API_URL } from '../../../shared/constants/api'
import { STORAGE_KEY } from '../../constants/storage'

export const useApiUrl = () => {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL)

  if (globalThis.chrome?.storage?.local) {
    globalThis.chrome.storage.local
      .get([STORAGE_KEY.API_URL])
      .then((result) => {
        if (result[STORAGE_KEY.API_URL]) {
          setApiUrl(result[STORAGE_KEY.API_URL])
        }
      })
  }

  return { apiUrl, setApiUrl }
}
