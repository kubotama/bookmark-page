import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { BookmarkForm } from './BookmarkForm'
import { INVALID_STRING, TestBookmarks } from '../../functions/test/fixtures'
import { UI_LABELS } from '../../shared/constants/uiMessages'
import { userEvent } from '@testing-library/user-event'

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

  beforeEach(() => {
    vi.stubGlobal('window', { open: vi.fn() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('開くボタンをクリックしたときに、正しいURLと属性で window.open が呼び出されること', async () => {
    const user = userEvent.setup()
    const targetBookmark = TestBookmarks[0]

    render(<BookmarkForm key={targetBookmark.id} bookmark={targetBookmark} />)

    const openButton = screen.getByRole('button', {
      name: UI_LABELS.ACTIONS.OPEN,
    })

    await user.click(openButton)

    expect(window.open).toHaveBeenCalledTimes(1) // 1回だけ呼ばれたか
    expect(window.open).toHaveBeenCalledWith(
      targetBookmark.url,
      '_blank', // 第2引数：ターゲット
      'noreferrer', // 第3引数：機能文字列
    )
  })

  it('URLを変更した場合には、変更したURLでwindow.open が呼び出されること', async () => {
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

    expect(window.open).toHaveBeenCalledTimes(1) // 1回だけ呼ばれたか
    expect(window.open).toHaveBeenCalledWith(
      inputUrl,
      '_blank', // 第2引数：ターゲット
      'noreferrer', // 第3引数：機能文字列
    )
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

    expect(window.open).toHaveBeenCalledTimes(0)
    expect(openButton).toBeDisabled()
  })
})
