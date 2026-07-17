import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BookmarkForm } from './BookmarkForm'
import { INVALID_STRING, TestBookmarks } from '../../functions/test/fixtures'
import { UI_LABELS } from '../../shared/constants/uiMessages'
import { userEvent } from '@testing-library/user-event'

const mockBack = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({
    history: {
      back: mockBack,
    },
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

    it('戻るボタンをクリックしたときに、router.history.back が呼び出されること', async () => {
      const user = userEvent.setup()
      const testBookmark = TestBookmarks[0]

      render(<BookmarkForm bookmark={testBookmark} />)

      // 💡 2. UI_LABELS.ACTIONS.BACK (戻る) のボタンを取得
      const backButton = screen.getByRole('button', {
        name: UI_LABELS.ACTIONS.BACK,
      })

      // ボタンをクリック
      await user.click(backButton)

      // 💡 3. モック関数が1回呼び出されたかを検証
      expect(mockBack).toHaveBeenCalledTimes(1)
    })
  })
})
