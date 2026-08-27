import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { TestKeywords } from '../../functions/test/fixtures'
import {
  createTestQueryClient,
  expectMutationSuccess,
} from '../test/test-utils'
import { useAddKeyword } from './useAddKeyword'

const { mockPost, mockShowErrorMessage } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockShowErrorMessage: vi.fn(),
}))

// Honoクライアントのモック化
vi.mock('hono/client', () => ({
  hc: () => ({
    api: {
      keywords: {
        $post: mockPost,
      },
    },
  }),
}))

// notification モジュールのモック化を追加
vi.mock('../lib/notification', () => ({
  showErrorMessage: mockShowErrorMessage,
}))

const renderAddKeyword = () => {
  const { mockInvalidateQueries, wrapper } = createTestQueryClient()
  const { result } = renderHook(() => useAddKeyword(), { wrapper })
  return { mockInvalidateQueries, result }
}

describe('useAddKeyword', () => {
  const payload = {
    name: TestKeywords[0].name,
  }

  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(window, 'alert').mockImplementation(() => {}) // alertのポップアップを抑制
  })

  it('更新APIが200を返したときにキャッシュが更新されること', async () => {
    mockPost.mockResolvedValueOnce({
      json: async () => ({
        data: payload,
        success: true,
      }),
      ok: true,
      status: 201,
    })

    const { mockInvalidateQueries, result } = renderAddKeyword()

    result.current.mutate(payload)

    await waitFor(() => {
      expectMutationSuccess({
        mockInvalidateQueries,
        mockMutation: mockPost,
        mockShowErrorMessage,
        payload: {
          json: {
            name: TestKeywords[0].name,
          },
        },
        queryKey: ['bookmarks', 'keywords'],

        result,
      })
    })
  })
})
