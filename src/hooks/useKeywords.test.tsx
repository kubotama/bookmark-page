import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TestKeywords } from '../../functions/test/fixtures'
import { ERROR_MESSAGE } from '../../shared/constants/uiMessages'
import { createTestQueryClient } from '../test/test-utils'
import { useKeywords } from './useKeywords'

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

const renderKeywords = () => {
  const { wrapper } = createTestQueryClient()
  const { result } = renderHook(() => useKeywords(), {
    wrapper,
  })
  return result
}

// ==========================================
// テストケース定義
// ==========================================
describe('useKeywords Hooks', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  // ----------------------------------------
  // useBookmarks（全件取得）のテスト
  // ----------------------------------------
  describe('useKeywords', () => {
    it('正常にデータを取得できること', async () => {
      mockGet.mockResolvedValue({
        json: async () => TestKeywords,
        ok: true,
      })

      const result = renderKeywords()

      // 最初のレンダリング時はローディング状態
      expect(result.current.isLoading).toBe(true)

      // 非同期でデータが解決されるのを待つ
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // 取得したデータの内容を検証
      expect(result.current.data).toEqual(TestKeywords)
    })

    it('サーバーエラーのときエラーをスローすること', async () => {
      // console.error のログ出力を抑制
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockGet.mockResolvedValue({
        ok: false,
      })

      const result = renderKeywords()

      // エラーが確定するまで待つ
      await waitFor(() => expect(result.current.isError).toBe(true))

      // 期待通りのエラーメッセージが返ってきているか検証
      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe(ERROR_MESSAGE.SERVER_ERROR)

      consoleSpy.mockRestore()
    })
  })
})
