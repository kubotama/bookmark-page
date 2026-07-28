import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { INVALID_STRING, TestBookmarks } from '../../functions/test/fixtures'
import { render } from '@testing-library/react'
import { BookmarkForm } from './BookmarkForm'
import { clickButton, inputText } from '../test/test-utils'
import { UI_LABELS } from '../../shared/constants/uiMessages'

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ history: { back: vi.fn() }, navigate: vi.fn() }),
}))

vi.mock('../hooks/useDeleteBookmark', () => ({
  useDeleteBookmark: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('../hooks/useUpdateBookmark', () => ({
  useUpdateBookmark: () => ({ mutate: vi.fn(), isPending: false }),
}))

describe('開くボタンの動作', () => {
  it('開くボタンをクリックしたときに、正しいURLと属性で window.open が呼び出されること', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    const user = userEvent.setup()
    const targetBookmark = TestBookmarks[0]

    render(<BookmarkForm key={targetBookmark.id} bookmark={targetBookmark} />)

    await clickButton(user, UI_LABELS.ACTIONS.OPEN)

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

    await inputText(user, UI_LABELS.FIELDS.URL, inputUrl)
    await clickButton(user, UI_LABELS.ACTIONS.OPEN)

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

    await inputText(user, UI_LABELS.FIELDS.URL, INVALID_STRING.URL)
    const openButton = await clickButton(user, UI_LABELS.ACTIONS.OPEN)

    expect(openButton).toBeDisabled()
  })
})
