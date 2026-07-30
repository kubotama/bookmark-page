import { QueryClient, QueryClientProvider } from '@tanstack/react-query' // 💡 QueryClient関係をインポート
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mockBookmarksData, TestBookmarks } from '../../functions/test/fixtures'
import { ERROR_MESSAGE, UI_LABELS } from '../../shared/constants/uiMessages'
import { routeTree } from '../routeTree.gen'

// jsdom環境用に window.scrollTo の警告を黙らせる
window.scrollTo = vi.fn()

// ==========================================
// 1. Hono クライアントのモック化
// ==========================================
const mockGet = vi.fn()

vi.mock('hono/client', () => ({
  hc: () => ({
    api: {
      bookmarks: {
        $get: () => mockGet(),
      },
    },
  }),
}))

const renderBookmarkDetailPage = async (id: string) => {
  // 1. メモリ履歴の設定
  const memoryHistory = createMemoryHistory({
    initialEntries: [`/bookmark/${id}`],
  })

  // 2. ルーターの作成
  const router = createRouter({
    history: memoryHistory,
    routeTree,
  })

  await router.load()

  // 💡 3. テスト用のクリーンな QueryClient を作成
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 0, // キャッシュの残り火によるテスト汚染を防止
        retry: false,
      },
    },
  })

  // 💡 4. QueryClientProvider でルーター全体をラップしてレンダリング
  render(
    <QueryClientProvider client={testQueryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('Bookmark Detail Page', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('URLパラメータからIDを正しく取得して表示できること', async () => {
    mockGet.mockResolvedValue({
      json: async () => mockBookmarksData,
      ok: true,
    })

    const targetBookmark = TestBookmarks[0]

    renderBookmarkDetailPage(targetBookmark.id)

    // カスタムフックを介して取得・表示されたタイトルを非同期で待つ
    const titleElement = await screen.findByRole('textbox', {
      name: UI_LABELS.FIELDS.TITLE,
    })
    expect(titleElement).toHaveValue(targetBookmark.title)
    const urlElement = await screen.findByRole('textbox', {
      name: UI_LABELS.FIELDS.URL,
    })
    expect(urlElement).toHaveValue(targetBookmark.url)
  })

  it('idがブックマークに存在しない場合には正しいメッセージが表示されること', async () => {
    mockGet.mockResolvedValue({
      json: async () => [],
      ok: true,
    })

    const targetBookmark = TestBookmarks[0]

    renderBookmarkDetailPage(targetBookmark.id)

    // カスタムフックを介して取得・表示されたタイトルを非同期で待つ
    const headerElement = await screen.findByText(UI_LABELS.HEADER.NO_BOOKMARKS)
    expect(headerElement).toBeInTheDocument()
  })

  it('ブックマークの取得がエラーの場合にはエラーメッセージが表示されること', async () => {
    mockGet.mockResolvedValue({
      error: new Error('error'),
      ok: false,
    })

    const targetBookmark = TestBookmarks[0]

    renderBookmarkDetailPage(targetBookmark.id)

    // カスタムフックを介して取得・表示されたタイトルを非同期で待つ
    const headerElement = await screen.findByText(ERROR_MESSAGE.SERVER_ERROR)
    expect(headerElement).toBeInTheDocument()
  })
})
