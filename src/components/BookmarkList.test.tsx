import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BookmarkList } from './BookmarkList'
import { UI_MESSAGES } from '@shared/constants'

describe('BookmarkList', () => {
  it('ローディング中にスピナーが表示されること', () => {
    render(
      <BookmarkList bookmarks={[]} isLoading={true} error={null} />
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByLabelText(UI_MESSAGES.LOADING_LABEL)).toBeInTheDocument()
  })

  it('ブックマーク一覧が正常に表示されること', () => {
    const mockBookmarks = [
      { id: '1', title: 'Test Bookmark 1', url: 'https://example.com/1' },
      { id: '2', title: 'Test Bookmark 2', url: 'https://example.com/2' },
    ]

    render(
      <BookmarkList
        bookmarks={mockBookmarks}
        isLoading={false}
        error={null}
      />
    )

    expect(screen.getByText('Test Bookmark 1')).toBeInTheDocument()
    expect(screen.getByText('Test Bookmark 2')).toBeInTheDocument()
    expect(screen.getByText('https://example.com/1')).toBeInTheDocument()
    expect(screen.getByText('https://example.com/2')).toBeInTheDocument()
  })

  it('データが空の場合に適切なメッセージが表示されること', () => {
    render(
      <BookmarkList bookmarks={[]} isLoading={false} error={null} />
    )
    expect(screen.getByText(UI_MESSAGES.NO_BOOKMARKS)).toBeInTheDocument()
  })

  it('エラー発生時にエラーメッセージが表示されること', () => {
    const error = new Error('Test Error')
    render(
      <BookmarkList bookmarks={[]} isLoading={false} error={error} />
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(UI_MESSAGES.ERROR_PREFIX)
    expect(alert).toHaveTextContent('Test Error')
  })

  it('Errorインスタンス以外のエラー発生時に、予期せぬエラーメッセージが表示されること', () => {
    render(
      <BookmarkList
        bookmarks={[]}
        isLoading={false}
        error="Unexpected string error"
      />
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(UI_MESSAGES.ERROR_PREFIX)
    expect(alert).toHaveTextContent(UI_MESSAGES.UNEXPECTED_ERROR)
  })

  it('不正な URL（javascript:等）が含まれる場合、href が # になること', () => {
    const mockBookmarks = [
      { id: '1', title: 'Evil Bookmark', url: 'javascript:alert(1)' },
    ]

    render(
      <BookmarkList
        bookmarks={mockBookmarks}
        isLoading={false}
        error={null}
      />
    )

    const link = screen.getByRole('link', { name: /Evil Bookmark/i })
    expect(link).toHaveAttribute('href', '#')
  })
})