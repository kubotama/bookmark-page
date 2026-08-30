import { renderHook, waitFor } from '@testing-library/react'
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
vi.mock('../../lib/notification', () => ({
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

  describe('異常系', () => {
    it.each([
      {
        errorName: 'バリデーション',
        errorText: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
        status: 400,
      },
      {
        errorName: '登録済みのキーワードを登録しようとした',
        errorText: UI_MESSAGES.API.DUPLICATE_KEYWORD,
        status: 409,
      },
      {
        errorName:
          '既に関連付けられているブックマークとキーワードを関連付けようとした',
        errorText: UI_MESSAGES.API.DUPLICATE_BKRELATION,
        status: 409,
      },
      {
        errorName: '一般的な',
        errorText: ERROR_MESSAGE.SERVER_ERROR,
        status: 500,
      },
    ])(
      `APIが$statusで$errorNameエラーを返したときにエラー処理が行われること`,
      async ({ errorText, status }) => {
        mockPost.mockResolvedValueOnce({
          json: async () => ({
            error: errorText,
            success: false,
          }),
          ok: false,
          status,
        })

        const { mockInvalidateQueries, result } = renderAddKeyword()

        result.current.mutate(payload)

        await waitFor(() => {
          expectMutationError({
            errorText,
            expectedQuery: { queryKey: ['keywords'] },
            mockInvalidateQueries,
            mockShowErrorMessage,
            result,
          })
        })
      },
    )

    it(`APIが不明なエラーを返したときにエラー処理が行われること`, async () => {
      mockPost.mockResolvedValueOnce({
        json: async () => ({
          success: false,
        }),
        ok: false,
        status: 500,
      })

      const { mockInvalidateQueries, result } = renderAddKeyword()

      result.current.mutate(payload)

      await waitFor(() => {
        expectMutationError({
          errorText: ERROR_MESSAGE.FAILED_ADD_KEYWORD,
          expectedQuery: { queryKey: ['keywords'] },
          mockInvalidateQueries,
          mockShowErrorMessage,
          result,
        })
      })
    })
  })
})
