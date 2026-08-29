import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mockKeywordsData, TestKeywords } from '../../functions/test/fixtures'
import { ERROR_MESSAGE, UI_LABELS } from '../../shared/constants/uiMessages'
import { routeTree } from '../routeTree.gen'
import { expectText } from '../test/test-utils'

window.scrollTo = vi.fn()

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

const renderKeywordPage = async (id: string) => {
  // 1. メモリ履歴の設定
  const memoryHistory = createMemoryHistory({
    initialEntries: [`/keyword/${id}`],
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

const expectTextbox = async (name: string, value: string) => {
  const titleElement = await screen.findByRole('textbox', { name })
  expect(titleElement).toHaveValue(value)
}

describe('Keyword Detail Page', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('URLパラメータからIDを正しく取得して表示できること', async () => {
    mockGet.mockResolvedValue({
      json: async () => mockKeywordsData,
      ok: true,
    })

    const targetKeyword = TestKeywords[0]

    renderKeywordPage(targetKeyword.id)

    // カスタムフックを介して取得・表示されたタイトルを非同期で待つ
    await expectTextbox(UI_LABELS.FIELDS.KEYWORD_NAME, targetKeyword.name)
  })

  type TestCase = {
    description: string
    expectedMessage: string
    mockData: object
  }

  const testCases: TestCase[] = [
    {
      description: 'idがキーワードに存在しない場合には正しい',
      expectedMessage: UI_LABELS.HEADER.NO_KEYWORDS,
      mockData: { json: async () => ({}), ok: true },
    },
    {
      description: 'キーワードの取得がエラーの場合にはエラー',
      expectedMessage: ERROR_MESSAGE.SERVER_ERROR,
      mockData: { ok: false },
    },
  ]

  it.each(testCases)(
    `$descriptionメッセージが表示されること`,
    async ({ expectedMessage, mockData }) => {
      mockGet.mockResolvedValue(mockData)

      const targetKeyword = TestKeywords[0]

      renderKeywordPage(targetKeyword.id)

      // カスタムフックを介して取得・表示されたタイトルを非同期で待つ
      await expectText({ text: expectedMessage })
    },
  )
})
