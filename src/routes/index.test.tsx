import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  mockTestBookmarkWithKeywords,
  TestBookmarkWithKeywords,
} from '../../functions/test/fixtures'
import { ERROR_MESSAGE, UI_LABELS } from '../../shared/constants/uiMessages'
import { routeTree } from '../routeTree.gen'

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

const expectBookmarkLink = async (label: string, id: string) => {
  const linkItem = await screen.findByText(label)
  expect(linkItem).toBeInTheDocument()
  expect(linkItem.closest('a')).toHaveAttribute('href', `/bookmark/${id}`)
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
      json: async () => mockTestBookmarkWithKeywords,
      ok: true,
    })

    await act(async () => {
      await renderIndexPage()
    })

    await expectBookmarkLink(
      TestBookmarkWithKeywords[0].title,
      TestBookmarkWithKeywords[0].id,
    )
    await expectBookmarkLink(
      TestBookmarkWithKeywords[1].title,
      TestBookmarkWithKeywords[1].id,
    )
  })

  type TestCase = {
    description: string
    expectedMessage: string
    mockData: object
  }

  const testCases: TestCase[] = [
    {
      description: 'ブックマークが空の場合に「データなし」の',
      expectedMessage: UI_LABELS.HEADER.NO_BOOKMARKS,
      mockData: {
        json: async () => ({ data: [], success: true }),
        ok: true,
      },
    },
    {
      description: 'サーバーエラー(res.okがfalse)が発生した際にエラー',
      expectedMessage: ERROR_MESSAGE.SERVER_ERROR,
      mockData: { ok: false },
    },
  ]

  it.each(testCases)(
    `$descriptionメッセージが表示されること`,
    async ({ expectedMessage, mockData }) => {
      mockGet.mockResolvedValue(mockData)

      await act(async () => {
        await renderIndexPage()
      })

      expect(await screen.findByText(expectedMessage)).toBeInTheDocument()
    },
  )
})
