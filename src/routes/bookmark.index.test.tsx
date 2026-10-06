import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { act, render } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { TestBookmarkWithKeywords } from '../../functions/test/fixtures'
import { UI_LABELS } from '../../shared/constants/uiMessages'
import { routeTree } from '../routeTree.gen'
import { expectText, TextTestType } from '../test/test-utils'

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

  type TestCase = {
    expectedTexts: TextTestType[]
    mockData: {
      data?: { data: typeof TestBookmarkWithKeywords; success: boolean }
      error?: Error | null
      isLoading?: boolean
    }
    testName: string
  }

  const testTexts = TestBookmarkWithKeywords.map((bookmark) => ({
    link: bookmark.url,
    text: bookmark.title,
  }))

  const testCases: TestCase[] = [
    {
      expectedTexts: [{ text: UI_LABELS.ACTIONS.LOADING }],
      mockData: { isLoading: true },
      testName: 'データ取得中はローディング画面が表示されること',
    },
    {
      expectedTexts: testTexts,
      mockData: { data: { data: TestBookmarkWithKeywords, success: true } },
      testName: 'APIから取得したブックマーク一覧が正常にレンダリングされること',
    },
    {
      expectedTexts: [{ text: UI_LABELS.HEADER.NO_BOOKMARKS }],
      mockData: { data: { data: [], success: true } },
      testName:
        'ブックマークが空の場合に「データなし」のメッセージが表示されること',
    },
  ]

  it.each(testCases)(`$testName`, async ({ expectedTexts, mockData }) => {
    // 正常系データを返すレスポンスをモック
    mockUseBookmarks.mockReturnValue(mockData)

    await act(async () => {
      await renderBookmarkPage()
    })

    for (const expected of expectedTexts) {
      await expectText(expected)
    }
  })
})
