import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDeleteBookmark } from './useDeleteBookmark'
import { uuidv7 } from 'uuidv7'
import { ERROR_MESSAGE } from '../../shared/constants/uiMessages'

// 💡 1. Hono RPC クライアントと共通のモック関数の準備
const { mockDelete, mockNavigate, mockInvalidateQueries } = vi.hoisted(() => ({
  mockDelete: vi.fn(),
  mockNavigate: vi.fn(),
  mockInvalidateQueries: vi.fn(),
}))

// Honoクライアントのモック化
vi.mock('hono/client', () => ({
  hc: () => ({
    api: {
      bookmarks: {
        ':id': {
          $delete: mockDelete,
        },
      },
    },
  }),
}))

// TanStack Router と共通クエリクライアントのモック化
vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({
    navigate: mockNavigate,
  }),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
    }),
  }
})

// 💡 2. TanStack Query用のラッパーコンポーネントを作成
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useDeleteBookmark', () => {
  const validId = uuidv7()

  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(window, 'alert').mockImplementation(() => {}) // alertのポップアップを抑制
  })

  // -------------------------------------------------------------
  // 1. 正常系：削除に成功した場合 (204)
  // -------------------------------------------------------------
  it('削除APIが204を返したとき、キャッシュが更新され、トップへ遷移すること', async () => {
    // APIレスポンスのモック設定 (204 No Content, ok: true)
    mockDelete.mockResolvedValueOnce({
      status: 204,
      ok: true,
    })

    const { result } = renderHook(() => useDeleteBookmark(), {
      wrapper: createWrapper(),
    })

    // 💡 フックの mutate を実行
    result.current.mutate(validId)

    // 非同期処理（onSuccess）が完了するまで待機して検証
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
      // 検証: 正しいIDでAPIが呼ばれたか
      expect(mockDelete).toHaveBeenCalledWith({ param: { id: validId } })
      // 検証: キャッシュ更新(invalidate)が走ったか
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['bookmarks'],
      })
      // 検証: 画面遷移したか
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/' })
    })
  })

  // -------------------------------------------------------------
  // 2. 異常系：その他の通信エラー（500など）の場合
  // -------------------------------------------------------------
  it('APIが500などの一般的なエラーを返したとき、エラー処理が行われること', async () => {
    const alertSpy = vi.spyOn(window, 'alert')

    mockDelete.mockResolvedValueOnce({
      status: 500,
      ok: false,
    })

    const { result } = renderHook(() => useDeleteBookmark(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(validId)

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(alertSpy).toHaveBeenCalledWith(ERROR_MESSAGE.FAILED_DELETE_BOOKMARK)
  })
})
