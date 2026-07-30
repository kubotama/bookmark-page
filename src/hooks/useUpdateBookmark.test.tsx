import { renderHook, waitFor } from '@testing-library/react'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, it, vi } from 'vitest'

import { TestBookmarks } from '../../functions/test/fixtures'
import { ERROR_MESSAGE, UI_MESSAGES } from '../../shared/constants/uiMessages'
import { SCHEMA_MESSAGE } from '../../shared/constants/validation'
import {
  createTestQueryClient,
  expectMutationError,
  expectMutationSuccess,
} from '../test/test-utils'
import { useUpdateBookmark } from './useUpdateBookmark'

const { mockPatch, mockShowErrorMessage } = vi.hoisted(() => ({
  mockPatch: vi.fn(),
  mockShowErrorMessage: vi.fn(),
}))

// Honoクライアントのモック化
vi.mock('hono/client', () => ({
  hc: () => ({
    api: {
      bookmarks: {
        ':id': {
          $patch: mockPatch,
        },
      },
    },
  }),
}))

// notification モジュールのモック化を追加
vi.mock('../lib/notification', () => ({
  showErrorMessage: mockShowErrorMessage,
}))

const renderUpdateBookmark = () => {
  const { mockInvalidateQueries, wrapper } = createTestQueryClient()
  const { result } = renderHook(() => useUpdateBookmark(), { wrapper })
  return { mockInvalidateQueries, result }
}

describe('useUpdateBookmark', () => {
  const validId = uuidv7()
  const updatedPayload = {
    id: validId,
    title: TestBookmarks[0].title,
    url: TestBookmarks[0].url,
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

    const { mockInvalidateQueries, result } = renderUpdateBookmark()

    result.current.mutate(updatedPayload)

    await waitFor(() => {
      expectMutationSuccess({
        mockInvalidateQueries,
        mockMutation: mockPatch,
        mockShowErrorMessage,
        payload: {
          json: {
            title: updatedPayload.title,
            url: updatedPayload.url,
          },
          param: { id: updatedPayload.id },
        },
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
        errorName: 'ブックマークが存在しない',
        errorText: UI_MESSAGES.API.NOT_FOUND_BOOKMARK,
        status: 404,
      },
      {
        errorName: '登録済みのurlを登録しようとした',
        errorText: UI_MESSAGES.API.DUPLICATE_URL,
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
        mockPatch.mockResolvedValueOnce({
          json: async () => ({
            error: errorText,
            success: false,
          }),
          ok: false,
          status,
        })

        const { mockInvalidateQueries, result } = renderUpdateBookmark()

        result.current.mutate(updatedPayload)

        await waitFor(() => {
          expectMutationError({
            errorText,
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

      const { mockInvalidateQueries, result } = renderUpdateBookmark()

      result.current.mutate(updatedPayload)

      await waitFor(() => {
        expectMutationError({
          errorText: ERROR_MESSAGE.FAILED_UPDATE_BOOKMARK,
          mockInvalidateQueries,
          mockShowErrorMessage,
          result,
        })
      })
    })
  })
})
