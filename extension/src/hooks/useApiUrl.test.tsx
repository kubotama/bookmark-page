import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TEST_API_URL, TestBookmarks } from '../../../functions/test/fixtures'
import { DEFAULT_API_URL } from '../../../shared/constants/api'
import { STORAGE_KEY } from '../../constants/storage'
import { useApiUrl } from './useApiUrl'

vi.mock('hono/client', () => {
  return {
    hc: vi.fn().mockReturnValue({
      api: {
        bookmarks: {
          $get: vi.fn().mockResolvedValue({
            json: async () => ({ data: TestBookmarks, success: true }),
            ok: true,
          }),
        },
      },
    }),
  }
})

describe('useApiUrl', () => {
  describe('初期化', () => {
    it.each([
      {
        description: 'APIが設定されている場合',
        expectedUrl: TEST_API_URL.LOCAL,
        url: TEST_API_URL.LOCAL,
      },
      {
        description: 'APIが設定されていない場合',
        expectedUrl: DEFAULT_API_URL,
        url: '',
      },
    ])('ストレージに$description', async ({ expectedUrl, url }) => {
      vi.spyOn(chrome.storage.local, 'get').mockImplementation(async () => ({
        [STORAGE_KEY.API_URL]: url,
      }))

      const { result } = renderHook(() => useApiUrl())

      await waitFor(() => {
        expect(result.current.apiUrl).toBe(expectedUrl)
      })
    })
  })
})
