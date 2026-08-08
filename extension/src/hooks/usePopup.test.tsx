import { act, renderHook, waitFor } from '@testing-library/react'
import { hc } from 'hono/client'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'

import {
  INVALID_STRING,
  TEST_API_URL,
  TEST_ERROR_MESSAGE,
  TestBookmarks,
} from '../../../functions/test/fixtures'
import { MessageBarType } from '../../../shared/components/MessageBar'
import { UI_MESSAGES } from '../../../shared/constants/uiMessages'
import { SCHEMA_MESSAGE } from '../../../shared/constants/validation'
import { usePopup } from './usePopup'

const { mockPost } = vi.hoisted(() => ({
  mockPost: vi.fn(),
}))

// 💡 Hono RPC クライアントの通信部分をモック化
vi.mock('hono/client', () => {
  return {
    hc: vi.fn().mockReturnValue({
      api: {
        bookmarks: {
          $post: mockPost,
        },
      },
    }),
  }
})

describe('usePopup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('起動時に chrome.tabs.query からタイトルとURLを取得して入力欄にセットすること', async () => {
    const { result } = renderHook(() => usePopup(TEST_API_URL.LOCAL))

    await waitFor(() => {
      expect(result.current.title).toBe(TestBookmarks[0].title)
      expect(result.current.url).toBe(TestBookmarks[0].url)
    })
  })

  it('addBookmarkを呼び出すとHono RPC APIが正しく呼び出されること', async () => {
    mockPost.mockResolvedValue({
      json: async () => ({ data: TestBookmarks, success: true }),
      ok: true,
    })
    const { result } = renderHook(() => usePopup(TEST_API_URL.LOCAL))

    let resultMessage: MessageBarType
    await act(async () => {
      resultMessage = await result.current.addBookmark()
    })

    await waitFor(() => {
      expect(hc).toHaveBeenCalledWith(TEST_API_URL.LOCAL, expect.any(Object))
      expect(mockPost).toHaveBeenCalledWith({
        json: { title: TestBookmarks[0].title, url: TestBookmarks[0].url },
      })
      expect(resultMessage?.type).toBe('success')
      expect(resultMessage?.text).toBe(UI_MESSAGES.BOOKMARKS.ADDED_BOOKMARK)
    })
  })

  it('APIへのURLが不正な場合', async () => {
    const { result } = renderHook(() => usePopup(INVALID_STRING.URL))

    let resultMessage: MessageBarType
    await act(async () => {
      resultMessage = await result.current.addBookmark()
    })

    await waitFor(() => {
      expect(hc).not.toHaveBeenCalled()
      expect(resultMessage?.type).toBe('error')
      expect(resultMessage?.text).toBe(SCHEMA_MESSAGE.PROTOCOL_CONSTRAINT)
    })
  })

  it('バックエンドでのエラー(メッセージあり)', async () => {
    mockPost.mockResolvedValue({
      json: async () => ({
        error: TEST_ERROR_MESSAGE.API_ERROR,
        success: false as const,
      }),
      ok: false,
      status: 500,
    })
    const { result } = renderHook(() => usePopup(TEST_API_URL.LOCAL))

    let resultMessage: MessageBarType
    await act(async () => {
      resultMessage = await result.current.addBookmark()
    })

    await waitFor(() => {
      expect(hc).toHaveBeenCalledWith(TEST_API_URL.LOCAL, expect.any(Object))
      expect(mockPost).toHaveBeenCalledWith({
        json: { title: TestBookmarks[0].title, url: TestBookmarks[0].url },
      })
      expect(resultMessage?.type).toBe('error')
      expect(resultMessage?.text).toBe(TEST_ERROR_MESSAGE.API_ERROR)
    })
  })

  it('バックエンドでのエラー(メッセージなし)', async () => {
    mockPost.mockResolvedValue({
      json: async () => ({
        success: false as const,
      }),
      ok: false,
      status: 500,
    })
    const { result } = renderHook(() => usePopup(TEST_API_URL.LOCAL))

    let resultMessage: MessageBarType
    await act(async () => {
      resultMessage = await result.current.addBookmark()
    })

    await waitFor(() => {
      expect(hc).toHaveBeenCalledWith(TEST_API_URL.LOCAL, expect.any(Object))
      expect(mockPost).toHaveBeenCalledWith({
        json: { title: TestBookmarks[0].title, url: TestBookmarks[0].url },
      })
      expect(resultMessage?.type).toBe('error')
      expect(resultMessage?.text).toBe(UI_MESSAGES.API.FAILED_CONNECT_SERVER)
    })
  })

  describe('POST /BOOKMARKS', () => {
    let consoleSpy: Mock<(...data: unknown[]) => void>
    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    it('非同期関数がreject(Error)の場合', async () => {
      mockPost.mockRejectedValue(new Error(TEST_ERROR_MESSAGE.API_ERROR))
      const { result } = renderHook(() => usePopup(TEST_API_URL.LOCAL))

      let resultMessage: MessageBarType
      await act(async () => {
        resultMessage = await result.current.addBookmark()
      })

      await waitFor(() => {
        expect(hc).toHaveBeenCalledWith(TEST_API_URL.LOCAL, expect.any(Object))
        expect(mockPost).toHaveBeenCalledWith({
          json: { title: TestBookmarks[0].title, url: TestBookmarks[0].url },
        })
        expect(resultMessage?.type).toBe('error')
        expect(resultMessage?.text).toBe(UI_MESSAGES.API.FAILED_CONNECT_SERVER)
        expect(consoleSpy).toHaveBeenCalledWith(TEST_ERROR_MESSAGE.API_ERROR)
      })
    })

    it('非同期関数がreject(Error以外)の場合', async () => {
      mockPost.mockRejectedValue('')
      const { result } = renderHook(() => usePopup(TEST_API_URL.LOCAL))

      let resultMessage: MessageBarType
      await act(async () => {
        resultMessage = await result.current.addBookmark()
      })

      await waitFor(() => {
        expect(hc).toHaveBeenCalledWith(TEST_API_URL.LOCAL, expect.any(Object))
        expect(mockPost).toHaveBeenCalledWith({
          json: { title: TestBookmarks[0].title, url: TestBookmarks[0].url },
        })
        expect(resultMessage?.type).toBe('error')
        expect(resultMessage?.text).toBe(UI_MESSAGES.API.FAILED_CONNECT_SERVER)
        expect(consoleSpy).not.toHaveBeenCalled()
      })
    })
  })
})
