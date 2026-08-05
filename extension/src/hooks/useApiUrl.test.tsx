import { act, renderHook, waitFor } from '@testing-library/react'
import { hc } from 'hono/client'
import { describe, expect, it, vi } from 'vitest'

import { TEST_API_URL, TestBookmarks } from '../../../functions/test/fixtures'
import { DEFAULT_API_URL } from '../../../shared/constants/api'
import { UI_MESSAGES } from '../../../shared/constants/uiMessages'
import { STORAGE_KEY } from '../../constants/storage'
import { useApiUrl } from './useApiUrl'

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}))

vi.mock('hono/client', () => {
  return {
    hc: vi.fn().mockReturnValue({
      api: {
        bookmarks: {
          $get: mockGet,
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

  describe('handleTestConnection', () => {
    it('正しいurlにアクセスすること', async () => {
      mockGet.mockResolvedValue({
        json: async () => ({ data: TestBookmarks, success: true }),
        ok: true,
      })
      vi.spyOn(chrome.storage.local, 'get').mockImplementation(async () => ({
        [STORAGE_KEY.API_URL]: '',
      }))

      const { result } = renderHook(() => useApiUrl())
      await waitFor(() => {
        expect(result.current.apiUrl).toBe(DEFAULT_API_URL)
      })
      await act(async () => {
        result.current.setApiUrl(TEST_API_URL.LOCAL)
      })
      await waitFor(() => {
        expect(result.current.apiUrl).toBe(TEST_API_URL.LOCAL)
      })

      await act(async () => {
        await result.current.testConnection()
      })
      expect(hc).toHaveBeenCalledWith(TEST_API_URL.LOCAL, expect.any(Object))
      expect(result.current.apiUrlMessage?.type).toBe('success')
      expect(result.current.apiUrlMessage?.text).toBe(
        UI_MESSAGES.BOOKMARKS.REGISTERED_BOOKMARKS(2),
      )
    })
  })
})
