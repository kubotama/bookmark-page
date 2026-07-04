import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { userEvent } from '@testing-library/user-event'
import { Popup } from './Popup'
import { client } from './lib/hono'
import {
  TEST_ERROR_MESSAGE,
  TestBookmarks,
} from '../../functions/test/fixtures'
import { DISPLAY_TEXT, SCHEMA_MESSAGE } from '../../functions/constants/string'

// 💡 Hono RPC クライアントの通信部分をモック化
vi.mock('./lib/hono', () => {
  return {
    client: {
      api: {
        bookmarks: {
          $post: vi.fn(() => ({
            ok: true,
            json: async () => ({ success: true }),
          })),
        },
      },
    },
  }
})

describe('Popup Component', () => {
  it('起動時に chrome.tabs.query からタイトルとURLを取得して入力欄にセットすること', () => {
    render(<Popup />)

    // setup.ts で仕込んだモックデータが入っているか検証
    const titleInput = screen.getByLabelText(
      DISPLAY_TEXT.TITLE,
    ) as HTMLInputElement
    const urlInput = screen.getByLabelText(DISPLAY_TEXT.URL) as HTMLInputElement

    expect(titleInput.value).toBe(TestBookmarks[0].title)
    expect(urlInput.value).toBe(TestBookmarks[0].url)
  })

  it('保存するボタンを押した際、Hono RPC APIが正しく呼び出されること', async () => {
    render(<Popup />)

    const submitButton = screen.getByRole('button', { name: '保存する' })
    const user = userEvent.setup()
    await user.click(submitButton)

    // 保存中の状態を経て、成功メッセージが出ることを検証
    await waitFor(() => {
      expect(
        screen.getByText('ブックマークを保存しました！'),
      ).toBeInTheDocument()
    })

    // APIがどんな引数で呼ばれたかを検証
    expect(client.api.bookmarks.$post).toHaveBeenCalledWith({
      json: {
        title: TestBookmarks[0].title,
        url: TestBookmarks[0].url,
      },
    })
  })

  describe('Popup 異常系のテスト', () => {
    it('サーバー側でバリデーションエラーが発生した場合、エラーメッセージが表示されること', async () => {
      type InferResponse<T extends (...args: never[]) => unknown> = Awaited<
        ReturnType<T>
      >
      type PostResponse = InferResponse<typeof client.api.bookmarks.$post>

      const mockResponse = {
        ok: false,
        status: 400,
        json: async () => ({
          success: false as const,
          error: SCHEMA_MESSAGE.INVALID_URL,
        }),
      } as unknown as PostResponse

      vi.mocked(client.api.bookmarks.$post).mockResolvedValueOnce(mockResponse)
      render(<Popup />)

      // 2. 送信ボタンをクリック
      const submitButton = screen.getByRole('button', {
        name: DISPLAY_TEXT.SAVE,
      })
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

      render(<Popup />)

      const submitButton = screen.getByRole('button', {
        name: DISPLAY_TEXT.SAVE,
      })
      const user = userEvent.setup()
      await user.click(submitButton)

      // 2. 「サーバーへの接続に失敗しました」の文言が表示されることを検証
      await waitFor(() => {
        expect(
          screen.getByText(DISPLAY_TEXT.FALED_CONNECT_SERVER),
        ).toBeInTheDocument()
      })
    })
  })
})

describe('APIのURLの保存', () => {
  it('ポップアップ画面が開いたときにAPIのURL関係の項目が表示されること', () => {
    render(<Popup />)

    const apiUrlInput = screen.getByLabelText(
      DISPLAY_TEXT.API_URL,
    ) as HTMLInputElement
    const apiUrlSaveButton = screen.getByRole('button', {
      name: DISPLAY_TEXT.SAVE_API_URL,
    })
    const apiUrlVerifyButton = screen.getByRole('button', {
      name: DISPLAY_TEXT.VERIFY_API_URL,
    })

    expect(apiUrlInput.value).toBe('')
    expect(apiUrlSaveButton).toBeInTheDocument()
    expect(apiUrlVerifyButton).toBeInTheDocument()
  })
})
