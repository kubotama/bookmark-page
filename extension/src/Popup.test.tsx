import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'

import { TEST_API_URL, TestBookmarks } from '../../functions/test/fixtures'
import { MessageBarType } from '../../shared/components/MessageBar'
import { DEFAULT_API_URL } from '../../shared/constants/api'
import { UI_LABELS, UI_MESSAGES } from '../../shared/constants/uiMessages'
import { clickButton, inputText } from '../../src/test/test-utils'
import { Popup } from './Popup'

const {
  mockAddBookmark,
  mockSaveApiUrl,
  mockSetApiUrl,
  mockSetTitle,
  mockSetUrl,
  mockTestConnection,
} = vi.hoisted(() => ({
  mockAddBookmark: vi.fn(),
  mockSaveApiUrl: vi.fn(),
  mockSetApiUrl: vi.fn(),
  mockSetTitle: vi.fn(),
  mockSetUrl: vi.fn(),
  mockTestConnection: vi.fn(),
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

vi.mock('./hooks/useApiUrl', () => ({
  useApiUrl: () => ({
    apiUrl: DEFAULT_API_URL,
    saveApiUrl: mockSaveApiUrl,
    setApiUrl: mockSetApiUrl,
    testConnection: mockTestConnection,
  }),
}))

type TestDataType = {
  buttonLabel: string
  description: string
  expectedParam: string | undefined
  message: MessageBarType
  mockFn: Mock<() => object>
}

describe('Popup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('起動時に chrome.tabs.query からタイトルとURLを取得して入力欄にセットすること', async () => {
    render(<Popup />)
    const titleInput = (await screen.findByLabelText(
      UI_LABELS.FIELDS.TITLE,
    )) as HTMLInputElement
    const urlInput = (await screen.findByLabelText(
      UI_LABELS.FIELDS.URL,
    )) as HTMLInputElement

    expect(titleInput.value).toBe(TestBookmarks[0].title)
    expect(urlInput.value).toBe(TestBookmarks[0].url)
  })

  it('APIのurlを変更したら、文字列の長さ回、変更する関数が呼び出されること', async () => {
    render(<Popup />)
    const user = userEvent.setup()
    await inputText(user, UI_LABELS.FIELDS.API_URL, TEST_API_URL.LOCAL)

    expect(mockSetApiUrl).toHaveBeenCalledTimes(TEST_API_URL.LOCAL.length + 1)
  })

  const testData: TestDataType[] = [
    {
      buttonLabel: UI_LABELS.ACTIONS.ADD_BOOKMARK,
      description:
        'ブックマークを追加するボタンを押したら、addBookmarkが正しく呼び出されること',
      expectedParam: DEFAULT_API_URL,
      message: { text: UI_MESSAGES.BOOKMARKS.ADDED_BOOKMARK, type: 'success' },
      mockFn: mockAddBookmark,
    },
    {
      buttonLabel: UI_LABELS.ACTIONS.ADD_BOOKMARK,
      description:
        'ブックマークの追加でエラーになったら、エラーメッセージが表示されること',
      expectedParam: DEFAULT_API_URL,
      message: { text: UI_MESSAGES.API.FAILED_CONNECT_SERVER, type: 'error' },
      mockFn: mockAddBookmark,
    },
    {
      buttonLabel: UI_LABELS.ACTIONS.SAVE_API_URL,
      description:
        'APIへのurlを保存するボタンを押したら、saveApiUrlが正しく呼び出されること',
      expectedParam: undefined,
      message: { text: UI_MESSAGES.API.SAVED_API_URL, type: 'success' },
      mockFn: mockSaveApiUrl,
    },
    {
      buttonLabel: UI_LABELS.ACTIONS.SAVE_API_URL,
      description:
        'APIへのurlの保存でエラーになったら、エラーメッセージが表示されること',
      expectedParam: undefined,
      message: { text: UI_MESSAGES.API.FAILED_SAVE_API_URL, type: 'error' },
      mockFn: mockSaveApiUrl,
    },
    {
      buttonLabel: UI_LABELS.ACTIONS.VERIFY_API_URL,
      description:
        'APIへのurlを検証するボタンを押したら、testConnectionが正しく呼び出されること',
      expectedParam: undefined,
      message: {
        text: UI_MESSAGES.BOOKMARKS.REGISTERED_BOOKMARKS(4),
        type: 'success',
      },
      mockFn: mockTestConnection,
    },
    {
      buttonLabel: UI_LABELS.ACTIONS.VERIFY_API_URL,
      description:
        'APIへのurlを検証でエラーになったら、エラーメッセージが表示されること',
      expectedParam: undefined,
      message: {
        text: UI_MESSAGES.API.FAILED_CONNECT_SERVER,
        type: 'error',
      },
      mockFn: mockTestConnection,
    },
  ]

  it.each(testData)(
    `$description`,
    async ({ buttonLabel, expectedParam, message, mockFn }) => {
      mockFn.mockResolvedValue(message)
      render(<Popup />)
      const user = userEvent.setup()
      clickButton(user, buttonLabel)

      // 保存中の状態を経て、成功メッセージが出ることを検証
      await waitFor(() => {
        expect(screen.getByText(message.text)).toBeInTheDocument()
      })

      // APIがどんな引数で呼ばれたかを検証
      if (expectedParam) expect(mockFn).toHaveBeenCalledWith(expectedParam)
      else expect(mockFn).toHaveBeenCalledWith()
    },
  )
})
