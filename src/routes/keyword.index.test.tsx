import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mockKeywordsData, TestKeywords } from '../../functions/test/fixtures'
import { ERROR_MESSAGE, UI_LABELS } from '../../shared/constants/uiMessages'
import { routeTree } from '../routeTree.gen'
import { expectText } from '../test/test-utils'

window.scrollTo = vi.fn()

// ==========================================
// 1. Hono クライアントのモック化
// ==========================================
const mockGet = vi.fn()

vi.mock('hono/client', () => ({
  hc: () => ({
    api: {
      keywords: {
        $get: () => mockGet(),
      },
    },
  }),
}))

// ==========================================
// 2. テスト用レンダリングヘルパー関数
// ==========================================
async function renderKeyword() {
  const memoryHistory = createMemoryHistory({
    initialEntries: [`/keyword`],
  })

  // 本物の routeTree を渡してルーターを初期化
  const router = createRouter({
    history: memoryHistory,
    routeTree,
  })

  await router.load()

  // テストごとにクリーンな QueryClient を作成（キャッシュの混ざりを防ぐ）
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 0, // キャッシュの残り火によるテスト汚染を防止
        retry: false, // テストが失敗した時に何度も再試行して遅くなるのを防ぐ
      },
    },
  })

  return render(
    <QueryClientProvider client={testQueryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

// ==========================================
// 3. テストケース定義
// ==========================================
describe('Keyword List Page', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('データ取得中はローディング画面が表示されること', async () => {
    // レンスポンスを意図的に保留状態（Promiseが解決しない）にしてローディングを維持
    mockGet.mockReturnValue(new Promise(() => {}))

    await act(async () => {
      await renderKeyword()
    })

    // UI_LABELS から読み込み中の文言が表示されているか検証
    expect(screen.getByText(UI_LABELS.ACTIONS.LOADING)).toBeInTheDocument()
  })

  it('APIから取得したブックマーク一覧が正常にレンダリングされること', async () => {
    // 正常系データを返すレスポンスをモック
    mockGet.mockResolvedValue({
      json: async () => mockKeywordsData,
      ok: true,
    })

    await act(async () => {
      await renderKeyword()
    })

    await expectText({
      link: `/keyword/${TestKeywords[0].id}`,
      text: TestKeywords[0].name,
    })
    await expectText({
      link: `/keyword/${TestKeywords[1].id}`,
      text: TestKeywords[1].name,
    })
  })

  type TestCase = {
    description: string
    expectedMessage: string
    mockData: object
  }

  const testCases: TestCase[] = [
    {
      description: 'ブックマークが空の場合に「データなし」の',
      expectedMessage: UI_LABELS.HEADER.NO_KEYWORDS,
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
        await renderKeyword()
      })
      await expectText({ text: expectedMessage })
    },
  )
})
