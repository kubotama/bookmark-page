import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { TestBookmarks } from '../functions/test/fixtures'
import App from './App'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DISPLAY_TEXT, ERROR_MESSAGE } from '../functions/constants/string'

const renderApp = (qc: QueryClient) => {
  return render(
    <QueryClientProvider client={qc}>
      <App />
    </QueryClientProvider>,
  )
}

describe('App Component (MVP Bookmark List)', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.restoreAllMocks()

    // 💡 テストごとに毎回新しい QueryClient を作成してキャッシュをクリアする
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // テスト中にエラーが発生した際、自動で3回リトライするのを防ぐ（テストを高速化するため）
        },
      },
    })
  })

  it(`データ取得中に「${DISPLAY_TEXT.LOADING}」が表示されること`, () => {
    // 応答を遅延させるダミーのfetchモック
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise(() => {}),
    )

    renderApp(queryClient)
    expect(screen.getByText(DISPLAY_TEXT.LOADING)).toBeInTheDocument()
  })

  it('APIから取得したブックマーク一覧が正しく画面にレンダリングされること', async () => {
    // fetchの戻り値をモック化
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: TestBookmarks,
      }),
    } as Response)

    renderApp(queryClient)

    // 非同期でデータが読み込まれ、タイトルが表示されるのを待つ
    await waitFor(() => {
      expect(screen.getByText(TestBookmarks[0].title)).toBeInTheDocument()
      expect(screen.getByText(TestBookmarks[1].title)).toBeInTheDocument()
    })

    // リンクが正しいURLを持っているか検証
    const linkElement = screen.getByText(
      TestBookmarks[0].title,
    ) as HTMLAnchorElement
    expect(linkElement.href).toBe(TestBookmarks[0].url)
  })

  it('データが空の場合に適切なメッセージが表示されること', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: undefined }),
    } as Response)
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    renderApp(queryClient)

    await waitFor(() => {
      expect(screen.getByText(DISPLAY_TEXT.NO_BOOKMARKS)).toBeInTheDocument()
      expect(consoleSpy).toHaveBeenCalledTimes(0)
    })
  })

  it('アプリケーションエラーの場合には適切なエラーメッセージが表示されること', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    renderApp(queryClient)

    await waitFor(() => {
      expect(screen.getByText(ERROR_MESSAGE.SERVER_ERROR)).toBeInTheDocument()
      expect(consoleSpy).toHaveBeenCalledWith(ERROR_MESSAGE.SERVER_ERROR)
    })
  })

  it('APIがエラーの場合にはエラーメッセージが返されること', async () => {
    const fetchError = new TypeError(ERROR_MESSAGE.API_ERROR)
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(fetchError)
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    renderApp(queryClient)

    await waitFor(() => {
      expect(screen.getByText(ERROR_MESSAGE.API_ERROR)).toBeInTheDocument()
      expect(consoleSpy).toHaveBeenCalledWith(ERROR_MESSAGE.API_ERROR)
    })
  })
})
