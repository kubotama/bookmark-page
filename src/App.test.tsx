import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from './test/setup'
import App from './App'
import { API_PATHS, HTTP_STATUS } from '@shared/constants'
import { MOCK_BOOKMARK_1 } from '@shared/test/fixtures'

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
    server.use(
      http.get(API_PATHS.BOOKMARKS, () => {
        return HttpResponse.json({ bookmarks: [MOCK_BOOKMARK_1] })
      }),
    )

    render(<App />, { wrapper })

    // データの取得待ちと表示確認
    expect(await screen.findByText(MOCK_BOOKMARK_1.title)).toBeInTheDocument()
  })

  it('APIエラー時にエラーメッセージが表示されること', async () => {
    server.use(
      http.get(API_PATHS.BOOKMARKS, () => {
        return new HttpResponse(null, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
      }),
    )

    render(<App />, { wrapper })

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})