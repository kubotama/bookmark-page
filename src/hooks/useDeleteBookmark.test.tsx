import { renderHook, waitFor } from '@testing-library/react'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, it, vi } from 'vitest'

import { ERROR_MESSAGE } from '../../shared/constants/uiMessages'
import { SCHEMA_MESSAGE } from '../../shared/constants/validation'
import {
  createTestQueryClient,
  expectMutationError,
  expectMutationSuccess,
} from '../test/test-utils'
import { useDeleteBookmark } from './useDeleteBookmark'

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
  const { mockInvalidateQueries, wrapper } = createTestQueryClient()

  const { result } = renderHook(() => useDeleteBookmark(), {
    wrapper,
  })
  return { mockInvalidateQueries, result }
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
      ok: true,
      status: 204,
    })

    const { mockInvalidateQueries, result } = renderDeleteBookmark()

    // 💡 フックの mutate を実行
    result.current.mutate(validId)

    // 非同期処理（onSuccess）が完了するまで待機して検証
    await waitFor(() => {
      expectMutationSuccess({
        mockInvalidateQueries,
        mockMutation: mockDelete,
        mockShowErrorMessage,
        navigate: { mockNavigate, path: '/' },
        payload: { param: { id: validId } },
        result,
      })
    })
  })

  // -------------------------------------------------------------
  // 2. 異常系：その他の通信エラー（500など）の場合
  // -------------------------------------------------------------
  // it('APIが500などの一般的なエラーを返したとき、エラー処理が行われること', async () => {
  it.each([
    {
      errorName: 'バリデーション',
      errorText: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
      status: 400,
    },
    {
      errorName: '一般的な',
      errorText: ERROR_MESSAGE.SERVER_ERROR,
      status: 500,
    },
  ])(
    `APIが$statusで$errorNameエラーを返したときにエラー処理が行われること`,
    async ({ errorText, status }) => {
      mockDelete.mockResolvedValueOnce({
        json: async () => ({
          error: errorText,
          success: false,
        }),
        ok: false,
        status: status,
      })

      const { mockInvalidateQueries, result } = renderDeleteBookmark()

      result.current.mutate(validId)

      await waitFor(() => {
        expectMutationError({
          errorText,
          mockInvalidateQueries,
          mockNavigate,
          mockShowErrorMessage,
          result,
        })
      })
    },
  )

  it(`APIが不明なエラーを返したときにエラー処理が行われること`, async () => {
    mockDelete.mockResolvedValueOnce({
      json: async () => ({
        success: false,
      }),
      ok: false,
      status: 500,
    })

    const { mockInvalidateQueries, result } = renderDeleteBookmark()

    result.current.mutate(validId)

    await waitFor(() => {
      expectMutationError({
        errorText: ERROR_MESSAGE.FAILED_DELETE_BOOKMARK,
        mockInvalidateQueries,
        mockNavigate,
        mockShowErrorMessage,
        result,
      })
    })
  })
})
