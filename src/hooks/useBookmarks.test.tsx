import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  INVALID_STRING,
  mockTestBookmarkWithKeywords,
  TestBookmarkWithKeywords,
} from '../../functions/test/fixtures'
import { ERROR_MESSAGE } from '../../shared/constants/uiMessages'
import { createTestQueryClient } from '../test/test-utils'
import { useBookmarkById, useBookmarks } from './useBookmarks'

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

const renderBookmark = () => {
  const { wrapper } = createTestQueryClient()
  const { result } = renderHook(() => useBookmarks(), {
    wrapper,
  })
  return result
}

const renderBookmarkById = (id: string) => {
  const { wrapper } = createTestQueryClient()
  const { result } = renderHook(() => useBookmarkById(id), {
    wrapper,
  })
  return result
}

// ==========================================
// テストケース定義
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
        json: async () => mockTestBookmarkWithKeywords,
        ok: true,
      })

      const result = renderBookmark()

      // 最初のレンダリング時はローディング状態
      expect(result.current.isLoading).toBe(true)

      // 非同期でデータが解決されるのを待つ
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // 取得したデータの内容を検証
      expect(result.current.data).toEqual(mockTestBookmarkWithKeywords)
    })

    it('サーバーエラーのときエラーをスローすること', async () => {
      mockGet.mockResolvedValue({
        ok: false,
      })

      const result = renderBookmark()

      // エラーが確定するまで待つ
      await waitFor(() => expect(result.current.isError).toBe(true))

      // 期待通りのエラーメッセージが返ってきているか検証
      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe(ERROR_MESSAGE.SERVER_ERROR)
    })
  })

  // ----------------------------------------
  // useBookmarkById（IDによる1件抽出）のテスト
  // ----------------------------------------
  describe('useBookmarkById', () => {
    it('指定したIDのブックマークを正しく抽出できること', async () => {
      mockGet.mockResolvedValue({
        json: async () => mockTestBookmarkWithKeywords,
        ok: true,
      })

      // 存在するIDを指定してフックを呼び出す
      const targetBookmark = TestBookmarkWithKeywords[0]
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
        json: async () => mockTestBookmarkWithKeywords,
        ok: true,
      })

      // 存在しない適当なIDを指定
      const result = renderBookmarkById(INVALID_STRING.ID)

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // 該当データがないため undefined であることを検証
      expect(result.current.bookmark).toBeUndefined()
    })
  })
})
