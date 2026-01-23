import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { BookmarkList } from './BookmarkList'
import { UI_MESSAGES } from '@shared/constants'
import type { Bookmark } from '@shared/schemas/bookmark'
import * as useBookmarkListModule from '../hooks/useBookmarkList'

describe('BookmarkList', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const mockBookmarks: Bookmark[] = [
    { id: '1', title: 'Test Bookmark 1', url: 'https://example.com/1' },
    { id: '2', title: 'Test Bookmark 2', url: 'https://example.com/2' },
  ]

  type TestCase = {
    name: string
    props: {
      bookmarks: Bookmark[]
      isLoading: boolean
      error: Error | string | null
    }
    assert: () => void | Promise<void>
  }

  const testCases: TestCase[] = [
    {
      name: 'ローディング中にスピナーが表示されること',
      props: { bookmarks: [], isLoading: true, error: null },
      assert: () => {
        expect(screen.getByRole('status')).toBeInTheDocument()
        expect(
          screen.getByLabelText(UI_MESSAGES.LOADING_LABEL),
        ).toBeInTheDocument()
      },
    },
    {
      name: 'ブックマーク一覧が正常に表示されること',
      props: { bookmarks: mockBookmarks, isLoading: false, error: null },
      assert: () => {
        expect(screen.getByText('Test Bookmark 1')).toBeInTheDocument()
        expect(screen.getByText('Test Bookmark 2')).toBeInTheDocument()
        expect(screen.getByRole('table')).toBeInTheDocument()
        expect(screen.getAllByRole('row')).toHaveLength(2)
      },
    },
    {
      name: 'データが空の場合に適切なメッセージが表示されること',
      props: { bookmarks: [], isLoading: false, error: null },
      assert: () => {
        expect(screen.getByText(UI_MESSAGES.NO_BOOKMARKS)).toBeInTheDocument()
      },
    },
    {
      name: 'Errorインスタンス発生時にエラーメッセージが表示されること',
      props: {
        bookmarks: [],
        isLoading: false,
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
        isLoading: false,
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
    render(<BookmarkList {...props} />)
    assert()
  })

  it('行をダブルクリックした際に handleDoubleClick が呼び出されること', async () => {
    const user = userEvent.setup()
    const handleDoubleClickSpy = vi.fn()

    vi.spyOn(useBookmarkListModule, 'useBookmarkList').mockReturnValue({
      handleDoubleClick: handleDoubleClickSpy,
    })

    render(
      <BookmarkList bookmarks={mockBookmarks} isLoading={false} error={null} />,
    )

    const row = screen.getByText('Test Bookmark 1').closest('tr')
    expect(row).not.toBeNull()

    if (row) {
      await user.dblClick(row)
      expect(handleDoubleClickSpy).toHaveBeenCalledWith(mockBookmarks[0].url)
    }
  })
})
