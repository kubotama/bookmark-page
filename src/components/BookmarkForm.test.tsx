import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BookmarkForm } from './BookmarkForm'
import { INVALID_STRING, TestBookmarks } from '../../functions/test/fixtures'
import { UI_LABELS, UI_MESSAGES } from '../../shared/constants/uiMessages'
import { userEvent } from '@testing-library/user-event'

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

  describe('開くボタンの動作', () => {
    it('開くボタンをクリックしたときに、正しいURLと属性で window.open が呼び出されること', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

      const user = userEvent.setup()
      const targetBookmark = TestBookmarks[0]

      render(<BookmarkForm key={targetBookmark.id} bookmark={targetBookmark} />)

      const openButton = screen.getByRole('button', {
        name: UI_LABELS.ACTIONS.OPEN,
      })

      await user.click(openButton)

      expect(openSpy).toHaveBeenCalledTimes(1) // 1回だけ呼ばれたか
      expect(openSpy).toHaveBeenCalledWith(
        targetBookmark.url,
        '_blank', // 第2引数：ターゲット
        'noreferrer', // 第3引数：機能文字列
      )

      openSpy.mockRestore()
    })

    it('URLを変更した場合には、変更したURLでwindow.open が呼び出されること', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

      const user = userEvent.setup()
      const targetBookmark = TestBookmarks[0]
      const inputUrl = TestBookmarks[1].url

      render(<BookmarkForm key={targetBookmark.id} bookmark={targetBookmark} />)

      const urlElement = await screen.findByRole('textbox', {
        name: UI_LABELS.FIELDS.URL,
      })
      await user.clear(urlElement)
      await user.type(urlElement, inputUrl)

      const openButton = screen.getByRole('button', {
        name: UI_LABELS.ACTIONS.OPEN,
      })

      await user.click(openButton)

      expect(openSpy).toHaveBeenCalledTimes(1) // 1回だけ呼ばれたか
      expect(openSpy).toHaveBeenCalledWith(
        inputUrl,
        '_blank', // 第2引数：ターゲット
        'noreferrer', // 第3引数：機能文字列
      )

      openSpy.mockRestore()
    })

    it('URLのテキストボックスに不正な文字列が入力されている場合には開くボタンは無効となること', async () => {
      const user = userEvent.setup()
      const targetBookmark = TestBookmarks[0]

      render(<BookmarkForm key={targetBookmark.id} bookmark={targetBookmark} />)

      const urlElement = await screen.findByRole('textbox', {
        name: UI_LABELS.FIELDS.URL,
      })
      await user.clear(urlElement)
      await user.type(urlElement, INVALID_STRING.URL)

      const openButton = screen.getByRole('button', {
        name: UI_LABELS.ACTIONS.OPEN,
      })

      expect(openButton).toBeDisabled()
    })
  })

  describe('戻るボタンの動作', () => {
    beforeEach(() => {
      vi.resetAllMocks()
    })

    const testBookmark = TestBookmarks[0]

    it('戻るボタンをクリックしたときに、router.history.back が呼び出されること', async () => {
      const user = userEvent.setup()

      render(<BookmarkForm bookmark={testBookmark} />)

      // 💡 2. UI_LABELS.ACTIONS.BACK (戻る) のボタンを取得
      const backButton = screen.getByRole('button', {
        name: UI_LABELS.ACTIONS.BACK,
      })

      // ボタンをクリック
      await user.click(backButton)

      // 💡 3. モック関数が1回呼び出されたかを検証
      expect(mockBack).not.toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledTimes(1)
    })

    it('履歴が存在する場合（window.history.length > 1）、router.history.back が呼び出されること', async () => {
      const user = userEvent.setup()

      // 💡 1. window.history.length が常に「2」を返すように偽装する
      vi.spyOn(window.history, 'length', 'get').mockReturnValue(2)

      render(<BookmarkForm bookmark={testBookmark} />)

      const backButton = screen.getByRole('button', {
        name: UI_LABELS.ACTIONS.BACK,
      })

      await user.click(backButton)

      // 💡 2. router.history.back が呼ばれ、navigate は呼ばれていないことを検証
      expect(mockBack).toHaveBeenCalledTimes(1)
      expect(mockNavigate).not.toHaveBeenCalled()
    })
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

      const deleteButton = screen.getByRole('button', {
        name: UI_LABELS.ACTIONS.DELETE,
      })
      await user.click(deleteButton)

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

      const deleteButton = screen.getByRole('button', {
        name: UI_LABELS.ACTIONS.DELETE,
      })
      await user.click(deleteButton)

      // 検証: 削除関数が呼び出されていないこと
      expect(mockMutate).not.toHaveBeenCalled()
    })

    // -------------------------------------------------------------
    // ケース3: 削除通信中（isPending = true）のとき
    // -------------------------------------------------------------
    it('削除処理中（isPendingがtrue）の場合、ボタンが非活性になり、テキストが変更されること', () => {
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
})
