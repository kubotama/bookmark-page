import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { BookmarkList } from './BookmarkList'
import { UI_MESSAGES } from '@shared/constants'
import type { Bookmark } from '@shared/schemas/bookmark'

describe('BookmarkList', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const mockBookmarks: Bookmark[] = [
    { id: '1', title: 'Test Bookmark 1', url: 'https://example.com/1' },
    { id: '2', title: 'Test Bookmark 2', url: 'https://example.com/2' },
  ]

  const defaultProps = {
    bookmarks: mockBookmarks,
    isLoading: false,
    error: null,
    selectedId: null,
    onRowClick: vi.fn(),
    onDoubleClick: vi.fn(),
  }

  type TestCase = {
    name: string
    props: Partial<typeof defaultProps>
    assert: () => void | Promise<void>
  }

  const testCases: TestCase[] = [
    {
      name: 'ローディング中にスピナーが表示されること',
      props: { bookmarks: [], isLoading: true },
      assert: () => {
        expect(screen.getByRole('status')).toBeInTheDocument()
        expect(
          screen.getByLabelText(UI_MESSAGES.LOADING_LABEL),
        ).toBeInTheDocument()
      },
    },
    {
      name: 'ブックマーク一覧が正常に表示されること',
      props: { bookmarks: mockBookmarks },
      assert: () => {
        expect(screen.getByText('Test Bookmark 1')).toBeInTheDocument()
        expect(screen.getByText('Test Bookmark 2')).toBeInTheDocument()
        expect(screen.getByRole('table')).toBeInTheDocument()
        expect(screen.getAllByRole('row')).toHaveLength(2)
      },
    },
    {
      name: 'データが空の場合に適切なメッセージが表示されること',
      props: { bookmarks: [] },
      assert: () => {
        expect(screen.getByText(UI_MESSAGES.NO_BOOKMARKS)).toBeInTheDocument()
      },
    },
    {
      name: 'Errorインスタンス発生時にエラーメッセージが表示されること',
      props: {
        bookmarks: [],
        error: new Error('Test Error'),
      },
      assert: () => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveTextContent(UI_MESSAGES.ERROR_PREFIX)
        expect(alert).toHaveTextContent('Test Error')
      },
    },
    {
      name: 'Errorインスタンス以外のエラー発生時に、予期せぬエラーメッセージが表示されること',
      props: {
        bookmarks: [],
        error: 'Unexpected string error',
      },
      assert: () => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveTextContent(UI_MESSAGES.ERROR_PREFIX)
        expect(alert).toHaveTextContent(UI_MESSAGES.UNEXPECTED_ERROR)
      },
    },
  ]

  it.each(testCases)('$name', ({ props, assert }) => {
    render(<BookmarkList {...defaultProps} {...props} />)
    assert()
  })

  it('選択された行のスタイルが反転すること', () => {
    render(<BookmarkList {...defaultProps} selectedId="1" />)

    const row = screen.getByText('Test Bookmark 1').closest('tr')
    const cell = screen.getByText('Test Bookmark 1')

    // 選択時のクラスを確認
    expect(row).toHaveClass('bg-blue-700')
    expect(cell).toHaveClass('text-white')
  })

  it('行をクリックした際に onRowClick が呼び出されること', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    render(<BookmarkList {...defaultProps} onRowClick={onRowClick} />)

    await user.click(screen.getByText('Test Bookmark 1'))
    expect(onRowClick).toHaveBeenCalledWith('1')
  })

  it('行をダブルクリックした際に onDoubleClick が呼び出されること', async () => {
    const user = userEvent.setup()
    const onDoubleClick = vi.fn()
    render(<BookmarkList {...defaultProps} onDoubleClick={onDoubleClick} />)

    await user.dblClick(screen.getByText('Test Bookmark 1'))
    expect(onDoubleClick).toHaveBeenCalledWith('https://example.com/1')
  })
})