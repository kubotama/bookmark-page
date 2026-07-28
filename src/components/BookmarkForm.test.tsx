import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BookmarkForm } from './BookmarkForm'
import { INVALID_STRING, TestBookmarks } from '../../functions/test/fixtures'
import { UI_LABELS } from '../../shared/constants/uiMessages'
import { userEvent } from '@testing-library/user-event'
import { inputText } from '../test/test-utils'

const mockBack = vi.fn()
const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({
    history: {
      back: mockBack,
    },
    navigate: mockNavigate,
  }),
}))

const mockMutate = vi.fn()
let mockIsPending = false

vi.mock('../hooks/useDeleteBookmark', () => ({
  useDeleteBookmark: () => ({
    mutate: mockMutate,
    isPending: mockIsPending,
  }),
}))

const mockUpdate = vi.fn()
const mockIsUpdatePending = false

vi.mock('../hooks/useUpdateBookmark', () => ({
  useUpdateBookmark: () => ({
    mutate: mockUpdate,
    isPending: mockIsUpdatePending,
  }),
}))

describe('BookmarkForm', () => {
  it('該当するブックマークのurlとタイトルが正しく表示されること', async () => {
    const targetBookmark = TestBookmarks[0]
    render(<BookmarkForm key={targetBookmark.id} bookmark={targetBookmark} />)

    const titleElement = await screen.findByRole('textbox', {
      name: UI_LABELS.FIELDS.TITLE,
    })
    expect(titleElement).toHaveValue(targetBookmark.title)
    const urlElement = await screen.findByRole('textbox', {
      name: UI_LABELS.FIELDS.URL,
    })
    expect(urlElement).toHaveValue(targetBookmark.url)
  })

  describe('更新ボタンの動作', () => {
    const testBookmark = TestBookmarks[0]

    const testData: { name: string; title?: string; url?: string }[] = [
      { name: 'タイトルもurlも変更しなければ' },
      { name: 'タイトルが不正ならば', title: '' },
      { name: 'urlが不正ならば', url: INVALID_STRING.URL },
      { name: 'urlがftpならば', url: INVALID_STRING.FTP },
    ]

    it.each(testData)(
      `$name更新ボタンが無効であること`,
      async ({ title, url }) => {
        const user = userEvent.setup()

        render(<BookmarkForm bookmark={testBookmark} />)

        await inputText(user, UI_LABELS.FIELDS.TITLE, title)
        await inputText(user, UI_LABELS.FIELDS.URL, url)

        const updateButton = await screen.findByRole('button', {
          name: UI_LABELS.ACTIONS.UPDATE,
        })
        expect(updateButton).toBeDisabled()
      },
    )

    it('タイトルを正しく変更したら更新ボタンが有効になること', async () => {
      const user = userEvent.setup()

      render(<BookmarkForm bookmark={testBookmark} />)

      await inputText(user, UI_LABELS.FIELDS.TITLE, TestBookmarks[1].title)

      const updateButton = await screen.findByRole('button', {
        name: UI_LABELS.ACTIONS.UPDATE,
      })
      expect(updateButton).toBeEnabled()
    })

    it('更新ボタンをクリックしたらupdateBookmark()が呼び出されること', async () => {
      const user = userEvent.setup()
      render(<BookmarkForm bookmark={testBookmark} />)

      await inputText(user, UI_LABELS.FIELDS.TITLE, TestBookmarks[1].title)

      const updateButton = await screen.findByRole('button', {
        name: UI_LABELS.ACTIONS.UPDATE,
      })
      await user.click(updateButton)

      // 検証: フックの削除関数が、正しいIDを引数にして呼ばれたか
      expect(mockUpdate).toHaveBeenCalledWith({
        id: testBookmark.id,
        title: TestBookmarks[1].title,
        url: testBookmark.url,
      })
    })
  })
})
