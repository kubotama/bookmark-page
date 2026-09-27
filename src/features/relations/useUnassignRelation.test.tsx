import { renderHook, waitFor } from '@testing-library/react'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, it, vi } from 'vitest'

import {
  createTestQueryClient,
  expectMutationSuccess,
} from '../../test/test-utils'
import { useUnassignRelation } from './useUnassignRelation'

const { mockDelete, mockShowErrorMessage } = vi.hoisted(() => ({
  mockDelete: vi.fn(),
  mockShowErrorMessage: vi.fn(),
}))

// Honoクライアントのモック化
vi.mock('hono/client', () => ({
  hc: () => ({
    api: {
      bookmarks: {
        ':bookmark_id': {
          keywords: {
            ':keyword_id': {
              $delete: mockDelete,
            },
          },
        },
      },
    },
  }),
}))

// notification モジュールのモック化を追加
vi.mock('../../lib/notification', () => ({
  showErrorMessage: mockShowErrorMessage,
}))

const renderUnassignRelation = () => {
  const { mockInvalidateQueries, wrapper } = createTestQueryClient()
  const { result } = renderHook(() => useUnassignRelation(), { wrapper })
  return { mockInvalidateQueries, result }
}

describe('useUnassignRelation', () => {
  const prepareIds = (ids?: { bookmark_id?: string; keyword_id?: string }) => {
    return {
      bookmark_id: ids?.bookmark_id ?? uuidv7(),
      keyword_id: ids?.keyword_id ?? uuidv7(),
    }
  }
  let mockConsole: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockConsole = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(window, 'alert').mockImplementation(() => {}) // alertのポップアップを抑制
  })
  it('正常に関連付け解除 API を呼び出し、クエリキャッシュを無効化すること', async () => {
    mockDelete.mockResolvedValue({
      ok: true,
      status: 204,
    })

    const { mockInvalidateQueries, result } = renderUnassignRelation()

    const { bookmark_id, keyword_id } = prepareIds()

    result.current.mutate({ bookmark_id, keyword_id })

    await waitFor(() => {
      expectMutationSuccess({
        mockConsole,
        mockInvalidateQueries,
        mockMutation: mockDelete,
        mockShowErrorMessage,
        payload: {
          param: { bookmark_id, keyword_id },
        },
        queryKey: ['bookmarks', 'keywords'],
        result,
      })
    })
  })
})
