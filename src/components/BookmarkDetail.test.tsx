import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { BookmarkDetail } from './BookmarkDetail'
import { MOCK_BOOKMARK_1 } from '@shared/test/fixtures'
import { UI_MESSAGES } from '@shared/constants'

describe('BookmarkDetail', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const defaultProps = {
    bookmark: MOCK_BOOKMARK_1,
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    onClose: vi.fn(),
  }

  it('ブックマークの情報が正しく表示されること', () => {
    render(<BookmarkDetail {...defaultProps} />)

    expect(screen.getByDisplayValue(MOCK_BOOKMARK_1.title)).toBeInTheDocument()
    expect(screen.getByDisplayValue(MOCK_BOOKMARK_1.url)).toBeInTheDocument()
  })

  it('入力内容を変更できること', async () => {
    const user = userEvent.setup()
    render(<BookmarkDetail {...defaultProps} />)

    const titleInput = screen.getByPlaceholderText('Bookmark Title')
    const urlInput = screen.getByPlaceholderText('https://...')

    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Title')
    await user.clear(urlInput)
    await user.type(urlInput, 'https://updated.com')

    expect(titleInput).toHaveValue('Updated Title')
    expect(urlInput).toHaveValue('https://updated.com')
  })

  it('更新ボタンクリック時に onUpdate が呼ばれること', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    render(<BookmarkDetail {...defaultProps} onUpdate={onUpdate} />)

    const titleInput = screen.getByPlaceholderText('Bookmark Title')
    await user.clear(titleInput)
    await user.type(titleInput, 'New Title')

    await user.click(screen.getByText(UI_MESSAGES.BUTTON_UPDATE))
    expect(onUpdate).toHaveBeenCalledWith('New Title', MOCK_BOOKMARK_1.url)
  })

  it('削除ボタンクリック時に confirm で OK を選ぶと onDelete が呼ばれること', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<BookmarkDetail {...defaultProps} onDelete={onDelete} />)

    await user.click(screen.getByText(UI_MESSAGES.BUTTON_DELETE))

    expect(confirmSpy).toHaveBeenCalledWith(UI_MESSAGES.DELETE_CONFIRM)
    expect(onDelete).toHaveBeenCalled()
  })

  it('削除ボタンクリック時に confirm でキャンセルを選ぶと onDelete が呼ばれないこと', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(<BookmarkDetail {...defaultProps} onDelete={onDelete} />)

    await user.click(screen.getByText(UI_MESSAGES.BUTTON_DELETE))

    expect(confirmSpy).toHaveBeenCalledWith(UI_MESSAGES.DELETE_CONFIRM)
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('開くボタンクリック時に window.open が呼ばれること', async () => {
    const user = userEvent.setup()
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    render(<BookmarkDetail {...defaultProps} />)

    await user.click(screen.getByText(UI_MESSAGES.BUTTON_OPEN))

    expect(openSpy).toHaveBeenCalledWith(MOCK_BOOKMARK_1.url, '_blank', 'noreferrer')
  })

  it('閉じるボタンクリック時に onClose が呼ばれること', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<BookmarkDetail {...defaultProps} onClose={onClose} />)

    // md:block なので通常は見えているはずだが、テスト環境によっては注意が必要
    const closeButton = screen.getByTitle(UI_MESSAGES.BUTTON_CLOSE)
    await user.click(closeButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('別のブックマークが選択された時に入力内容が更新されること', () => {
    const { rerender } = render(<BookmarkDetail {...defaultProps} />)
    
    expect(screen.getByDisplayValue(MOCK_BOOKMARK_1.title)).toBeInTheDocument()

    const NEW_BOOKMARK = { ...MOCK_BOOKMARK_1, id: '2', title: 'New Selection' } as any
    rerender(<BookmarkDetail {...defaultProps} bookmark={NEW_BOOKMARK} />)

    expect(screen.getByDisplayValue('New Selection')).toBeInTheDocument()
  })
})
