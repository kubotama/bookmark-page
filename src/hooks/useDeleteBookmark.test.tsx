import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDeleteBookmark } from './useDeleteBookmark'
import { uuidv7 } from 'uuidv7'
import { ERROR_MESSAGE } from '../../shared/constants/uiMessages'
import { SCHEMA_MESSAGE } from '../../shared/constants/validation'
import { createTestQueryClient, expectMutationError } from '../test/test-utils'

// 💡 1. Hono RPC クライアントと共通のモック関数の準備
const { mockDelete, mockNavigate, mockShowErrorMessage } = vi.hoisted(() => ({
  mockDelete: vi.fn(),
  mockNavigate: vi.fn(),
  mockShowErrorMessage: vi.fn(),
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

// notification モジュールのモック化を追加
vi.mock('../lib/notification', () => ({
  showErrorMessage: mockShowErrorMessage,
}))

const renderDeleteBookmark = () => {
  const { wrapper, mockInvalidateQueries } = createTestQueryClient()

  const { result } = renderHook(() => useDeleteBookmark(), {
    wrapper,
  })
  return { result, mockInvalidateQueries }
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

    const { result, mockInvalidateQueries } = renderDeleteBookmark()

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

      expect(mockShowErrorMessage).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------
  // 2. 異常系：その他の通信エラー（500など）の場合
  // -------------------------------------------------------------
  // it('APIが500などの一般的なエラーを返したとき、エラー処理が行われること', async () => {
  it.each([
    {
      status: 400,
      errorName: 'バリデーション',
      errorText: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
    },
    {
      status: 500,
      errorName: '一般的な',
      errorText: ERROR_MESSAGE.SERVER_ERROR,
    },
  ])(
    `APIが$statusで$errorNameエラーを返したときにエラー処理が行われること`,
    async ({ status, errorText }) => {
      mockDelete.mockResolvedValueOnce({
        status: status,
        ok: false,
        json: async () => ({
          success: false,
          error: errorText,
        }),
      })

      const { result, mockInvalidateQueries } = renderDeleteBookmark()

      result.current.mutate(validId)

      await waitFor(() => {
        expectMutationError({
          result,
          errorText,
          mockShowErrorMessage,
          mockNavigate,
          mockInvalidateQueries,
        })
      })
    },
  )

  it(`APIが不明なエラーを返したときにエラー処理が行われること`, async () => {
    mockDelete.mockResolvedValueOnce({
      status: 500,
      ok: false,
      json: async () => ({
        success: false,
      }),
    })

    const { result, mockInvalidateQueries } = renderDeleteBookmark()

    result.current.mutate(validId)

    await waitFor(() => {
      expectMutationError({
        result,
        errorText: ERROR_MESSAGE.FAILED_DELETE_BOOKMARK,
        mockShowErrorMessage,
        mockNavigate,
        mockInvalidateQueries,
      })
    })
  })
})
