import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { TestBookmarks } from '@functions/test/fixtures'
import App from './App'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

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

  it('データ取得中に「読み込み中...」が表示されること', () => {
    // 応答を遅延させるダミーのfetchモック
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise(() => {}),
    )

    renderApp(queryClient)
    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('APIから取得したブックマーク一覧が正しく画面にレンダリングされること', async () => {
    // fetchの戻り値をモック化
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        return {
          success: true,
          data: TestBookmarks,
        }
      },
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
      json: async () => ({ success: true, data: [] }),
    } as Response)
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    renderApp(queryClient)

    await waitFor(() => {
      expect(
        screen.getByText('サーバーエラーが発生しました'),
      ).toBeInTheDocument()
      expect(consoleSpy).toHaveBeenCalledWith('サーバーエラーが発生しました')
    })
  })

  it('APIがエラーの場合にはエラーメッセージが返されること', async () => {
    const fetchError = new TypeError('Failed to fetch')
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(fetchError)
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    renderApp(queryClient)

    await waitFor(() => {
      expect(screen.getByText(fetchError.message)).toBeInTheDocument()
      expect(consoleSpy).toHaveBeenCalledWith(fetchError.message)
    })
  })
})
