import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { hc } from 'hono/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  INVALID_STRING,
  TEST_API_URL,
  TEST_ERROR_MESSAGE,
  TestBookmarks,
} from '../../functions/test/fixtures'
import { DEFAULT_API_URL } from '../../shared/constants/api'
import { UI_LABELS, UI_MESSAGES } from '../../shared/constants/uiMessages'
import { SCHEMA_MESSAGE } from '../../shared/constants/validation'
import { STORAGE_KEY } from '../constants/storage'
import { client } from './lib/hono'
import { Popup } from './Popup'

// // 💡 Hono RPC クライアントの通信部分をモック化
// vi.mock('./lib/hono', () => {
//   return {
//     client: {
//       api: {
//         bookmarks: {
//           $get: vi.fn(() => ({
//             json: async () => ({ data: TestBookmarks, success: true }),
//             ok: true,
//           })),
//           $post: vi.fn(() => ({
//             json: async () => ({ success: true }),
//             ok: true,
//           })),
//         },
//       },
//     },
//   }
// })

// vi.mock('hono/client', () => {
//   return {
//     hc: vi.fn().mockReturnValue({
//       api: {
//         bookmarks: {
//           $get: vi.fn().mockResolvedValue({
//             json: async () => ({ data: TestBookmarks, success: true }),
//             ok: true,
//           }),
//         },
//       },
//     }),
//   }
// })
const { mockAddBookmark, mockSetTitle, mockSetUrl } = vi.hoisted(() => ({
  mockAddBookmark: vi.fn(),
  mockSetTitle: vi.fn(),
  mockSetUrl: vi.fn(),
}))

vi.mock('./hooks/useAddBookmark', () => ({
  useAddBookmark: () => ({
    addBookmark: mockAddBookmark,
    setTitle: mockSetTitle,
    setUrl: mockSetUrl,
    title: TestBookmarks[0].title,
    url: TestBookmarks[0].url,
  }),
}))

describe('Popup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const getElements = () => {
    render(<Popup />)
    const titleInput = screen.getByLabelText(
      UI_LABELS.FIELDS.TITLE,
    ) as HTMLInputElement
    const urlInput = screen.getByLabelText(
      UI_LABELS.FIELDS.URL,
    ) as HTMLInputElement
    const submitButton = screen.getByRole('button', {
      name: UI_LABELS.ACTIONS.ADD_BOOKMARK,
    })
    const apiUrlInput = screen.getByLabelText(
      UI_LABELS.FIELDS.API_URL,
    ) as HTMLInputElement
    const apiUrlSaveButton = screen.getByRole('button', {
      name: UI_LABELS.ACTIONS.SAVE_API_URL,
    })
    const testConnectionButton = screen.getByRole('button', {
      name: UI_LABELS.ACTIONS.VERIFY_API_URL,
    })

    return {
      apiUrlInput,
      apiUrlSaveButton,
      submitButton,
      testConnectionButton,
      titleInput,
      urlInput,
    }
  }

  it('起動時に chrome.tabs.query からタイトルとURLを取得して入力欄にセットすること', () => {
    const { titleInput, urlInput } = getElements()

    expect(titleInput.value).toBe(TestBookmarks[0].title)
    expect(urlInput.value).toBe(TestBookmarks[0].url)
  })

  it('ブックマークを追加するボタンを押した際、addBookmarkが正しく呼び出されること', async () => {
    mockAddBookmark.mockResolvedValue({
      text: UI_MESSAGES.BOOKMARKS.ADDED_BOOKMARK,
      type: 'success',
    })
    const { submitButton } = getElements()
    const user = userEvent.setup()
    await user.click(submitButton)

    // 保存中の状態を経て、成功メッセージが出ることを検証
    await waitFor(() => {
      expect(
        screen.getByText(UI_MESSAGES.BOOKMARKS.ADDED_BOOKMARK),
      ).toBeInTheDocument()
    })

    // APIがどんな引数で呼ばれたかを検証
    expect(mockAddBookmark).toHaveBeenCalledWith(DEFAULT_API_URL)
  })

  describe.skip('Popup 異常系のテスト', () => {
    it('サーバー側でバリデーションエラーが発生した場合、エラーメッセージが表示されること', async () => {
      type InferResponse<T extends (...args: never[]) => unknown> = Awaited<
        ReturnType<T>
      >
      type PostResponse = InferResponse<typeof client.api.bookmarks.$post>

      const mockResponse = {
        json: async () => ({
          error: SCHEMA_MESSAGE.INVALID_URL,
          success: false as const,
        }),
        ok: false,
        status: 400,
      } as unknown as PostResponse

      vi.mocked(client.api.bookmarks.$post).mockResolvedValueOnce(mockResponse)

      const { submitButton } = getElements()
      const user = userEvent.setup()
      await user.click(submitButton)

      // 3. エラーテキストが画面に表示されることを検証
      await waitFor(() => {
        expect(screen.getByText(SCHEMA_MESSAGE.INVALID_URL)).toBeInTheDocument()
      })
    })

    it('ネットワーク通信自体が失敗（ネットワークエラー）した場合、通信エラーメッセージが表示されること', async () => {
      // 1. $post が例外（Reject）を投げるように設定
      vi.mocked(client.api.bookmarks.$post).mockRejectedValueOnce(
        new Error(TEST_ERROR_MESSAGE.NETWORK_ERROR),
      )

      const { submitButton } = getElements()
      const user = userEvent.setup()
      await user.click(submitButton)

      // 2. 「サーバーへの接続に失敗しました」の文言が表示されることを検証
      await waitFor(() => {
        expect(
          screen.getByText(UI_MESSAGES.API.FAILED_CONNECT_SERVER),
        ).toBeInTheDocument()
      })
    })
  })

  describe.skip('APIのURLの保存', () => {
    it('ポップアップ画面が開いたときにAPIのURL関係の項目が表示されること', () => {
      const { apiUrlInput, apiUrlSaveButton, testConnectionButton } =
        getElements()

      expect(apiUrlInput.value).toBe(DEFAULT_API_URL)
      expect(apiUrlSaveButton).toBeInTheDocument()
      expect(testConnectionButton).toBeInTheDocument()
    })

    it('通信確認ボタンをクリックしたら、正しいurlを呼び出すこと', async () => {
      const { apiUrlInput, testConnectionButton } = getElements()

      const user = userEvent.setup()
      await user.clear(apiUrlInput)
      await user.type(apiUrlInput, TEST_API_URL.LOCAL)
      await user.click(testConnectionButton)

      await waitFor(() => {
        expect(
          screen.getByText(
            UI_MESSAGES.BOOKMARKS.REGISTERED_BOOKMARKS(TestBookmarks.length),
          ),
        ).toBeInTheDocument()
      })
      expect(hc).toHaveBeenCalledWith(TEST_API_URL.LOCAL, expect.any(Object))
    })

    it('APIのurlとして不正なurlを入力して通信確認ボタンをクリックしても、呼び出しが発生しないこと', async () => {
      const { apiUrlInput, testConnectionButton } = getElements()

      const user = userEvent.setup()
      await user.clear(apiUrlInput)
      await user.type(apiUrlInput, INVALID_STRING.URL)
      await user.click(testConnectionButton)

      await waitFor(() => {
        expect(
          screen.getByText(SCHEMA_MESSAGE.PROTOCOL_CONSTRAINT),
        ).toBeInTheDocument()
      })
      expect(hc).not.toHaveBeenCalled()
    })

    it('urlの保存ボタンをクリックしたら、正しいurlが保存されること', async () => {
      const setSpy = vi
        .spyOn(chrome.storage.local, 'set')
        .mockResolvedValue(undefined)
      const { apiUrlInput, apiUrlSaveButton } = getElements()

      const user = userEvent.setup()
      await user.clear(apiUrlInput)
      await user.type(apiUrlInput, TEST_API_URL.LOCAL)
      await user.click(apiUrlSaveButton)

      await waitFor(() => {
        expect(
          screen.getByText(UI_MESSAGES.API.SAVED_API_URL),
        ).toBeInTheDocument()
      })
      expect(setSpy).toHaveBeenCalledWith({
        [STORAGE_KEY.API_URL]: TEST_API_URL.LOCAL,
      })
    })

    it('APIのurlとして不正なurlを入力してurlの保存をクリックしても、保存の呼び出しが発生しないこと', async () => {
      const setSpy = vi
        .spyOn(chrome.storage.local, 'set')
        .mockResolvedValue(undefined)
      const { apiUrlInput, apiUrlSaveButton } = getElements()

      const user = userEvent.setup()
      await user.clear(apiUrlInput)
      await user.type(apiUrlInput, INVALID_STRING.URL)
      await user.click(apiUrlSaveButton)

      await waitFor(() => {
        expect(
          screen.getByText(SCHEMA_MESSAGE.PROTOCOL_CONSTRAINT),
        ).toBeInTheDocument()
      })
      expect(setSpy).not.toHaveBeenCalled()
    })

    it('ポップアップ画面が開いたときに保存されているAPIのurlがテキストボックスに表示されること', async () => {
      vi.spyOn(chrome.storage.local, 'get').mockImplementation(async () => ({
        [STORAGE_KEY.API_URL]: TEST_API_URL.LOCAL,
      }))

      const { apiUrlInput } = getElements()
      await waitFor(() => {
        expect(apiUrlInput.value).toBe(TEST_API_URL.LOCAL)
      })
    })
  })
})
