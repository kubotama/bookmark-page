import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/setup'
import { BookmarkList } from './BookmarkList'
import { UI_MESSAGES, API_PATHS } from '@shared/constants'

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
)

describe('BookmarkList', () => {
  it('ローディング中にスピナーが表示されること', () => {
    server.use(
      http.get(API_PATHS.BOOKMARKS, () => {
        // 意図的な遅延
        return new Promise((resolve) => setTimeout(() => resolve(HttpResponse.json({ bookmarks: [] })), 100))
      })
    )

    render(<BookmarkList />, { wrapper })
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByLabelText(UI_MESSAGES.LOADING_LABEL)).toBeInTheDocument()
  })

  it('ブックマーク一覧が正常に表示されること', async () => {
    const mockBookmarks = [
      { id: '1', title: 'Test Bookmark 1', url: 'https://example.com/1' },
      { id: '2', title: 'Test Bookmark 2', url: 'https://example.com/2' },
    ]

    server.use(
      http.get(API_PATHS.BOOKMARKS, () => {
        return HttpResponse.json({ bookmarks: mockBookmarks })
      })
    )

    render(<BookmarkList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Test Bookmark 1')).toBeInTheDocument()
      expect(screen.getByText('Test Bookmark 2')).toBeInTheDocument()
    })

    expect(screen.getByText('https://example.com/1')).toBeInTheDocument()
    expect(screen.getByText('https://example.com/2')).toBeInTheDocument()
  })

  it('データが空の場合に適切なメッセージが表示されること', async () => {
    server.use(
      http.get(API_PATHS.BOOKMARKS, () => {
        return HttpResponse.json({ bookmarks: [] })
      })
    )

    render(<BookmarkList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText(UI_MESSAGES.NO_BOOKMARKS)).toBeInTheDocument()
    })
  })

  it('エラー発生時にエラーメッセージが表示されること', async () => {
    server.use(
      http.get(API_PATHS.BOOKMARKS, () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    render(<BookmarkList />, { wrapper })

    await waitFor(() => {
      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent(UI_MESSAGES.ERROR_PREFIX)
      expect(alert).toHaveTextContent(UI_MESSAGES.FETCH_FAILED)
    })
  })

  it('不正な URL（javascript:等）が含まれる場合、href が # になること', async () => {
    const mockBookmarks = [
      { id: '1', title: 'Evil Bookmark', url: 'javascript:alert(1)' },
    ]

    server.use(
      http.get(API_PATHS.BOOKMARKS, () => {
        return HttpResponse.json({ bookmarks: mockBookmarks })
      })
    )

    render(<BookmarkList />, { wrapper })

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /Evil Bookmark/i })
      expect(link).toHaveAttribute('href', '#')
    })
  })
})
