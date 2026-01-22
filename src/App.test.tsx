import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from './test/setup'
import App from './App'
import { API_PATHS } from '@shared/constants'

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

describe('App Integration', () => {
  it('ブックマーク一覧が正常に取得・表示されること', async () => {
    const mockBookmarks = [
      { id: '1', title: 'Integrated Bookmark', url: 'https://example.com' },
    ]

    server.use(
      http.get(API_PATHS.BOOKMARKS, () => {
        return HttpResponse.json({ bookmarks: mockBookmarks })
      })
    )

    render(<App />, { wrapper })

    // ヘッダーの確認
    expect(screen.getByText('Bookmark Page')).toBeInTheDocument()

    // データの取得待ちと表示確認
    expect(await screen.findByText('Integrated Bookmark')).toBeInTheDocument()
  })

  it('APIエラー時にエラーメッセージが表示されること', async () => {
    server.use(
      http.get(API_PATHS.BOOKMARKS, () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    render(<App />, { wrapper })

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
