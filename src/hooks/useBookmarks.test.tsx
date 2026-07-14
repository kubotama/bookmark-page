// src/hooks/useBookmarks.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useBookmarks, useBookmarkById } from './useBookmarks'
import { ERROR_MESSAGE } from '../../shared/constants/uiMessages'
import React from 'react'
import {
  INVALID_STRING,
  mockBookmarksData,
  TestBookmarks,
} from '../../functions/test/fixtures'

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
// 2. テスト用ラッパーのセットアップ
// ==========================================
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // エラー系のテストがリトライで遅くなるのを防ぐ
        gcTime: 0, // キャッシュがテスト間で残るのを防ぐ
      },
    },
  })
}

const mockWrapper = () => {
  const queryClient = createTestQueryClient()
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return wrapper
}

const renderBookmark = () => {
  const { result } = renderHook(() => useBookmarks(), {
    wrapper: mockWrapper(),
  })
  return result
}

const renderBookmarkById = (id: string) => {
  const { result } = renderHook(() => useBookmarkById(id), {
    wrapper: mockWrapper(),
  })
  return result
}

// ==========================================
// 3. テストケース定義
// ==========================================
describe('useBookmarks Hooks', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  // ----------------------------------------
  // useBookmarks（全件取得）のテスト
  // ----------------------------------------
  describe('useBookmarks', () => {
    it('正常にデータを取得できること', async () => {
      mockGet.mockResolvedValue({
        ok: true,
        json: async () => mockBookmarksData,
      })

      const result = renderBookmark()

      // 最初のレンダリング時はローディング状態
      expect(result.current.isLoading).toBe(true)

      // 非同期でデータが解決されるのを待つ
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // 取得したデータの内容を検証
      expect(result.current.data).toEqual(mockBookmarksData)
    })

    it('サーバーエラーのときエラーをスローすること', async () => {
      // console.error のログ出力を抑制
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockGet.mockResolvedValue({
        ok: false,
      })

      const result = renderBookmark()

      // エラーが確定するまで待つ
      await waitFor(() => expect(result.current.isError).toBe(true))

      // 期待通りのエラーメッセージが返ってきているか検証
      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe(ERROR_MESSAGE.SERVER_ERROR)

      consoleSpy.mockRestore()
    })
  })

  // ----------------------------------------
  // useBookmarkById（IDによる1件抽出）のテスト
  // ----------------------------------------
  describe('useBookmarkById', () => {
    it('指定したIDのブックマークを正しく抽出できること', async () => {
      mockGet.mockResolvedValue({
        ok: true,
        json: async () => mockBookmarksData,
      })

      // 存在するIDを指定してフックを呼び出す
      const targetBookmark = TestBookmarks[0]
      const result = renderBookmarkById(targetBookmark.id)

      // データが解決するのを待つ
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // 指定したIDのデータだけが find で抜き出せているか検証
      expect(result.current.bookmark).toBeDefined()
      expect(result.current.bookmark?.title).toBe(targetBookmark.title)
      expect(result.current.bookmark?.url).toBe(targetBookmark.url)
    })

    it('存在しないIDを指定した場合、bookmarkが undefined になること', async () => {
      mockGet.mockResolvedValue({
        ok: true,
        json: async () => mockBookmarksData,
      })

      // 存在しない適当なIDを指定
      const result = renderBookmarkById(INVALID_STRING.ID)

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // 該当データがないため undefined であることを検証
      expect(result.current.bookmark).toBeUndefined()
    })
  })
})
