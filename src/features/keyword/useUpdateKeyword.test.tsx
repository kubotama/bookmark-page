import { renderHook, waitFor } from '@testing-library/react'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, it, vi } from 'vitest'

import { TestKeywords } from '../../../functions/test/fixtures'
import {
  ERROR_MESSAGE,
  UI_MESSAGES,
} from '../../../shared/constants/uiMessages'
import { SCHEMA_MESSAGE } from '../../../shared/constants/validation'
import {
  createTestQueryClient,
  expectMutationError,
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

  type TestCase = {
    description: string
    errorMessage: string
    statusCode: number
  }

  const testCases: TestCase[] = [
    {
      description: 'バリデーション',
      errorMessage: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
      statusCode: 400,
    },
    {
      description: 'キーワードが存在しない',
      errorMessage: UI_MESSAGES.API.NOT_FOUND_KEYWORD,
      statusCode: 404,
    },
    {
      description: '登録済みのキーワードを登録しようとした',
      errorMessage: UI_MESSAGES.API.DUPLICATE_KEYWORD,
      statusCode: 409,
    },
    {
      description: '一般的な',
      errorMessage: ERROR_MESSAGE.SERVER_ERROR,
      statusCode: 500,
    },
  ]

  it.each(testCases)(
    `APIが$statusCodeで$errorMessageエラーを返したときにエラー処理が行われること`,
    async ({ errorMessage, statusCode }) => {
      mockPatch.mockResolvedValueOnce({
        json: async () => ({
          error: errorMessage,
          success: false,
        }),
        ok: false,
        status: statusCode,
      })

      const { mockInvalidateQueries, result } = renderUpdateKeyword()

      result.current.mutate(updatedPayload)

      await waitFor(() => {
        expectMutationError({
          errorText: errorMessage,
          mockInvalidateQueries,
          mockShowErrorMessage,
          result,
        })
      })
    },
  )

  it(`APIが不明なエラーを返したときにエラー処理が行われること`, async () => {
    mockPatch.mockResolvedValueOnce({
      json: async () => ({
        success: false,
      }),
      ok: false,
      status: 500,
    })

    const { mockInvalidateQueries, result } = renderUpdateKeyword()

    result.current.mutate(updatedPayload)

    await waitFor(() => {
      expectMutationError({
        errorText: ERROR_MESSAGE.FAILED_UPDATE_KEYWORD,
        mockInvalidateQueries,
        mockShowErrorMessage,
        result,
      })
    })
  })
})
