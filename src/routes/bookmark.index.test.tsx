import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TestBookmarkWithKeywords } from '../../functions/test/fixtures'
import { UI_LABELS } from '../../shared/constants/uiMessages'
import { routeTree } from '../routeTree.gen'

window.scrollTo = vi.fn()

// ==========================================
// テスト用レンダリングヘルパー関数
// ==========================================
async function renderBookmarkPage() {
  const memoryHistory = createMemoryHistory({
    initialEntries: [`/bookmark`],
  })

  // 本物の routeTree を渡してルーターを初期化
  const router = createRouter({
    history: memoryHistory,
    routeTree,
  })

  // テストごとにクリーンな QueryClient を作成（キャッシュの混ざりを防ぐ）
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 0, // キャッシュの残り火によるテスト汚染を防止
        retry: false, // テストが失敗した時に何度も再試行して遅くなるのを防ぐ
      },
    },
  })

  await router.load()

  return render(
    <QueryClientProvider client={testQueryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

const mockUseBookmarks = vi.fn()
vi.mock('../features/bookmark/useBookmarks', () => ({
  useBookmarks: () => mockUseBookmarks(),
}))

describe('Bookmark Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('データ取得中はローディング画面が表示されること', async () => {
    // レンスポンスを意図的に保留状態（Promiseが解決しない）にしてローディングを維持
    mockUseBookmarks.mockReturnValue({ isLoading: true })

    await act(async () => {
      await renderBookmarkPage()
    })

    // UI_LABELS から読み込み中の文言が表示されているか検証
    expect(screen.getByText(UI_LABELS.ACTIONS.LOADING)).toBeInTheDocument()
  })
})
