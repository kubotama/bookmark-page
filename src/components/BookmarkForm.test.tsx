import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BookmarkForm } from './BookmarkForm'
import { INVALID_STRING, TestBookmarks } from '../../functions/test/fixtures'
import { UI_LABELS, UI_MESSAGES } from '../../shared/constants/uiMessages'
import { userEvent } from '@testing-library/user-event'
import { clickButton, inputText } from '../test/test-utils'

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

  describe('BookmarkDetail - handleDelete', () => {
    const testBookmark = TestBookmarks[0]

    beforeEach(() => {
      vi.resetAllMocks()
      mockIsPending = false // ローディング状態をデフォルトに戻す
    })

    // -------------------------------------------------------------
    // ケース1: 確認ダイアログで「OK」を選んだとき
    // -------------------------------------------------------------
    it('削除ボタンを押し、ダイアログでOKを押した場合、deleteBookmarkが実行されること', async () => {
      const user = userEvent.setup()

      // 💡 window.confirm が呼び出されたら「true（OK）」を返すように偽装
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

      render(<BookmarkForm bookmark={testBookmark} />)

      await clickButton(user, UI_LABELS.ACTIONS.DELETE)

      // 検証: 確認ダイアログが正しい文言で開かれたか
      expect(confirmSpy).toHaveBeenCalledWith(
        UI_MESSAGES.BOOKMARKS.CONFIRM_DELETE(testBookmark.title),
      )
      // 検証: フックの削除関数が、正しいIDを引数にして呼ばれたか
      expect(mockMutate).toHaveBeenCalledWith(testBookmark.id)
    })

    // -------------------------------------------------------------
    // ケース2: 確認ダイアログで「キャンセル」を選んだとき
    // -------------------------------------------------------------
    it('削除ボタンを押し、ダイアログでキャンセルを押した場合、削除処理が中断されること', async () => {
      const user = userEvent.setup()

      // 💡 window.confirm が呼び出されたら「false（キャンセル）」を返すように偽装
      vi.spyOn(window, 'confirm').mockReturnValue(false)

      render(<BookmarkForm bookmark={testBookmark} />)

      await clickButton(user, UI_LABELS.ACTIONS.DELETE)

      // 検証: 削除関数が呼び出されていないこと
      expect(mockMutate).not.toHaveBeenCalled()
    })

    // -------------------------------------------------------------
    // ケース3: 削除通信中（isPending = true）のとき
    // -------------------------------------------------------------
    it('削除処理中（isPendingがtrue）の場合、ボタンが非活性になること', () => {
      // 💡 テストケース実行前にローディング状態を再現
      mockIsPending = true

      render(<BookmarkForm bookmark={testBookmark} />)

      const deleteButton = screen.getByRole('button', {
        name: UI_LABELS.ACTIONS.DELETE,
      })

      // 検証: ボタンが disabled（非活性）になっていること
      expect(deleteButton).toBeDisabled()
    })
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
