// src/routes/index.test.tsx
// import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { Route as IndexRoute } from './index'
import { UI_LABELS } from '../../shared/constants/uiMessages'
// 💡 自動生成されたルートツリーをインポートして重複エラーを解消
import { routeTree } from '../routeTree.gen'

window.scrollTo = vi.fn()

// ==========================================
// 1. Hono クライアントのモック化
// ==========================================
const mockBookmarksData = {
  success: true,
  data: [
    {
      id: '0190a618-9a7c-7000-8000-000000000001',
      title: 'テストGoogle',
      url: 'https://google.com',
    },
    {
      id: '0190a618-9a7c-7000-8000-000000000002',
      title: 'テストGitHub',
      url: 'https://github.com',
    },
  ],
}

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

// ==========================================
// 2. テスト用レンダリングヘルパー関数
// ==========================================
async function renderIndexPage() {
  // テストごとにクリーンな QueryClient を作成（キャッシュの混ざりを防ぐ）
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // テストが失敗した時に何度も再試行して遅くなるのを防ぐ
      },
    },
  })

  // 本物の routeTree を渡してルーターを初期化
  const router = createRouter({ routeTree })

  await router.load()

  return render(
    <QueryClientProvider client={testQueryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

// ==========================================
// 3. テストケース定義
// ==========================================
describe('Index Page (Bookmark List)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('データ取得中はローディング画面が表示されること', async () => {
    // レンスポンスを意図的に保留状態（Promiseが解決しない）にしてローディングを維持
    mockGet.mockReturnValue(new Promise(() => {}))

    await act(async () => {
      await renderIndexPage()
    })

    // UI_LABELS から読み込み中の文言が表示されているか検証
    expect(screen.getByText(UI_LABELS.ACTIONS.LOADING)).toBeInTheDocument()
  })

  it('APIから取得したブックマーク一覧が正常にレンダリングされること', async () => {
    // 正常系データを返すレスポンスをモック
    mockGet.mockResolvedValue({
      ok: true,
      json: async () => mockBookmarksData,
    })

    await act(async () => {
      await renderIndexPage()
    })

    // 非同期データ取得と描画の完了を待つため findByText を使用
    const firstBookmark = await screen.findByText('テストGoogle')
    const secondBookmark = await screen.findByText('テストGitHub')

    expect(firstBookmark).toBeInTheDocument()
    expect(secondBookmark).toBeInTheDocument()

    // リンクの href 属性が正しく設定されているか検証
    expect(firstBookmark.closest('a')).toHaveAttribute(
      'href',
      `/bookmark/${mockBookmarksData.data[0].id}`,
    )
  })

  it('ブックマークが空の場合に「データなし」のメッセージが表示されること', async () => {
    // データが空の配列を返すレスポンスをモック
    mockGet.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    })

    await act(async () => {
      await renderIndexPage()
    })

    // ブックマークがない場合の専用文言が表示されるか検証
    const noDataMessage = await screen.findByText(UI_LABELS.HEADER.NO_BOOKMARKS)
    expect(noDataMessage).toBeInTheDocument()
  })

  it('サーバーエラー(res.okがfalse)が発生した際にエラーメッセージが表示されること', async () => {
    // エラーによる console.error の出力をテストログで汚さないためのハック（任意）
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // APIがエラーを返した状態を模倣
    mockGet.mockResolvedValue({
      ok: false,
    })

    await act(async () => {
      await renderIndexPage()
    })

    // エラーハンドリングによって表示される要素を検証
    // ※ index.tsx 内の `throw new Error(ERROR_MESSAGE.SERVER_ERROR)` に基づくテキスト
    const errorText = await screen.findByText(/エラー/i)
    expect(errorText).toBeInTheDocument()

    consoleSpy.mockRestore()
  })
})
