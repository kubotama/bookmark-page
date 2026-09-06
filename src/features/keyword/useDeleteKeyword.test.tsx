import { renderHook, waitFor } from '@testing-library/react'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, it, vi } from 'vitest'

import {
  createTestQueryClient,
  expectMutationSuccess,
} from '../../test/test-utils'
import { useDeleteKeyword } from './useDeleteKeyword'

const { mockBack, mockDelete, mockShowErrorMessage } = vi.hoisted(() => ({
  mockBack: vi.fn(),
  mockDelete: vi.fn(),
  mockShowErrorMessage: vi.fn(),
}))

// Honoクライアントのモック化
vi.mock('hono/client', () => ({
  hc: () => ({
    api: {
      keywords: {
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
    history: {
      back: mockBack,
    },
  }),
}))

// notification モジュールのモック化を追加
vi.mock('../../lib/notification', () => ({
  showErrorMessage: mockShowErrorMessage,
}))

const renderDeleteKeyword = () => {
  const { mockInvalidateQueries, wrapper } = createTestQueryClient()

  const { result } = renderHook(() => useDeleteKeyword(), {
    wrapper,
  })
  return { mockInvalidateQueries, result }
}

describe('useDeleteKeyword', () => {
  const validId = uuidv7()

  beforeEach(() => {
    vi.resetAllMocks()
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

    const { mockInvalidateQueries, result } = renderDeleteKeyword()

    // 💡 フックの mutate を実行
    result.current.mutate(validId)

    // 非同期処理（onSuccess）が完了するまで待機して検証
    await waitFor(() => {
      expectMutationSuccess({
        back: mockBack,
        mockInvalidateQueries,
        mockMutation: mockDelete,
        mockShowErrorMessage,
        payload: { param: { id: validId } },
        queryKey: ['bookmarks', 'keywords'],
        result,
      })
    })
  })
})
