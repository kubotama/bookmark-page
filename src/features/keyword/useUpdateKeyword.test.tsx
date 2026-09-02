import { renderHook, waitFor } from '@testing-library/react'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, it, vi } from 'vitest'

import { TestKeywords } from '../../../functions/test/fixtures'
import {
  createTestQueryClient,
  expectMutationSuccess,
} from '../../test/test-utils'
import { useUpdateKeyword } from './useUpdateKeyword'

const { mockPatch, mockShowErrorMessage } = vi.hoisted(() => ({
  mockPatch: vi.fn(),
  mockShowErrorMessage: vi.fn(),
}))

// Honoクライアントのモック化
vi.mock('hono/client', () => ({
  hc: () => ({
    api: {
      keywords: {
        ':id': {
          $patch: mockPatch,
        },
      },
    },
  }),
}))

// notification モジュールのモック化を追加
vi.mock('../../lib/notification', () => ({
  showErrorMessage: mockShowErrorMessage,
}))

const renderUpdateKeyword = () => {
  const { mockInvalidateQueries, wrapper } = createTestQueryClient()
  const { result } = renderHook(() => useUpdateKeyword(), { wrapper })
  return { mockInvalidateQueries, result }
}

describe('useUpdateKeyword', () => {
  const validId = uuidv7()
  const updatedPayload = {
    id: validId,
    name: TestKeywords[0].name,
  }

  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(window, 'alert').mockImplementation(() => {}) // alertのポップアップを抑制
  })

  it('更新APIが200を返したときにキャッシュが更新されること', async () => {
    mockPatch.mockResolvedValueOnce({
      json: async () => ({
        data: updatedPayload,
        success: true,
      }),
      ok: true,
      status: 200,
    })

    const { mockInvalidateQueries, result } = renderUpdateKeyword()

    result.current.mutate(updatedPayload)

    await waitFor(() => {
      expectMutationSuccess({
        mockInvalidateQueries,
        mockMutation: mockPatch,
        mockShowErrorMessage,
        payload: {
          json: {
            name: updatedPayload.name,
          },
          param: { id: updatedPayload.id },
        },
        queryKey: ['bookmarks', 'keywords'],
        result,
      })
    })
  })
})
