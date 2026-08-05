import { act, renderHook, waitFor } from '@testing-library/react'
import { hc } from 'hono/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { json } from 'zod'

import {
  INVALID_STRING,
  TEST_API_URL,
  TestBookmarks,
} from '../../../functions/test/fixtures'
import { DEFAULT_API_URL } from '../../../shared/constants/api'
import { UI_MESSAGES } from '../../../shared/constants/uiMessages'
import { SCHEMA_MESSAGE } from '../../../shared/constants/validation'
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

const setupHook = async (url: string) => {
  vi.spyOn(chrome.storage.local, 'get').mockImplementation(async () => ({
    [STORAGE_KEY.API_URL]: '',
  }))

  const { result } = renderHook(() => useApiUrl())
  await waitFor(() => {
    expect(result.current.apiUrl).toBe(DEFAULT_API_URL)
  })
  await act(async () => {
    result.current.setApiUrl(url)
  })
  await waitFor(() => {
    expect(result.current.apiUrl).toBe(url)
  })
  return result
}

describe('useApiUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

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
      expect(mockGet).toHaveBeenCalledWith()
      expect(result.current.apiUrlMessage?.type).toBe('success')
      expect(result.current.apiUrlMessage?.text).toBe(
        UI_MESSAGES.BOOKMARKS.REGISTERED_BOOKMARKS(2),
      )
    })

    it('urlが不正な場合にはアクセスしないこと', async () => {
      const result = await setupHook(INVALID_STRING.URL)

      await act(async () => {
        await result.current.testConnection()
      })
      expect(hc).not.toHaveBeenCalled()
      expect(mockGet).not.toHaveBeenCalled()
      expect(result.current.apiUrlMessage?.type).toBe('error')
      expect(result.current.apiUrlMessage?.text).toBe(
        SCHEMA_MESSAGE.PROTOCOL_CONSTRAINT,
      )
    })

    it.each([
      {
        description: '認証エラー(401)',
        expectedMessage: UI_MESSAGES.AUTH.ZERO_TRUST_AUTH_ERROR,
        response: { ok: false, status: 401 },
      },
      {
        description: '認証エラー(403)',
        expectedMessage: UI_MESSAGES.AUTH.ZERO_TRUST_AUTH_ERROR,
        response: { ok: false, status: 401 },
      },
      {
        description: 'その他のエラー(500)',
        expectedMessage: UI_MESSAGES.API.FAILED_CONNECT_SERVER,
        response: { ok: false, status: 500 },
      },
      {
        description: '文法エラー',
        expectedMessage: UI_MESSAGES.AUTH.INVALID_RESPONSE,
        response: {
          json: async () => ({ data: '', success: false }),
          ok: true,
        },
      },
    ])('$description', async ({ expectedMessage, response }) => {
      mockGet.mockResolvedValue(response)

      const result = await setupHook(TEST_API_URL.LOCAL)
      await act(async () => {
        await result.current.testConnection()
      })

      expect(result.current.apiUrlMessage?.type).toBe('error')
      expect(result.current.apiUrlMessage?.text).toBe(expectedMessage)
    })

    it('タイムアウト', async () => {
      const abortError = new Error('AbortError')
      abortError.name = 'AbortError'
      mockGet.mockRejectedValue(abortError)

      const result = await setupHook(TEST_API_URL.LOCAL)
      await act(async () => {
        await result.current.testConnection()
      })

      expect(result.current.apiUrlMessage?.type).toBe('error')
      expect(result.current.apiUrlMessage?.text).toBe(
        UI_MESSAGES.API.TIMEOUT_CONNECT_SERVER,
      )
    })

    it('異常なエラー', async () => {
      mockGet.mockRejectedValue('')

      const result = await setupHook(TEST_API_URL.LOCAL)
      await act(async () => {
        await result.current.testConnection()
      })

      expect(result.current.apiUrlMessage?.type).toBe('error')
      expect(result.current.apiUrlMessage?.text).toBe(
        UI_MESSAGES.API.FAILED_CONNECT_SERVER,
      )
    })
  })
})
