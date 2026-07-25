import { renderHook, waitFor } from '@testing-library/react'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TestBookmarks } from '../../functions/test/fixtures'
import { useUpdateBookmark } from './useUpdateBookmark'
import { ERROR_MESSAGE, UI_MESSAGES } from '../../shared/constants/uiMessages'
import { SCHEMA_MESSAGE } from '../../shared/constants/validation'
import { createTestQueryClient, expectMutationError } from '../test/test-utils'

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
  const { wrapper, mockInvalidateQueries } = createTestQueryClient()
  const { result } = renderHook(() => useUpdateBookmark(), { wrapper })
  return { result, mockInvalidateQueries }
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
      status: 200,
      ok: true,
      json: async () => ({
        success: true,
        data: updatedPayload,
      }),
    })

    const { result, mockInvalidateQueries } = renderUpdateBookmark()

    result.current.mutate(updatedPayload)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)

      expect(mockPatch).toHaveBeenCalledWith({
        param: { id: updatedPayload.id },
        json: {
          title: updatedPayload.title,
          url: updatedPayload.url,
        },
      })

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['bookmarks'],
      })

      expect(mockShowErrorMessage).not.toHaveBeenCalled()
    })
  })

  describe('異常系', () => {
    it.each([
      {
        status: 400,
        errorName: 'バリデーション',
        errorText: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
      },
      {
        status: 404,
        errorName: 'ブックマークが存在しない',
        errorText: UI_MESSAGES.API.NOT_FOUND_BOOKMARK,
      },
      {
        status: 409,
        errorName: '登録済みのurlを登録しようとした',
        errorText: UI_MESSAGES.API.DUPLICATE_URL,
      },
      {
        status: 500,
        errorName: '一般的な',
        errorText: ERROR_MESSAGE.SERVER_ERROR,
      },
    ])(
      `APIが$statusで$errorNameエラーを返したときにエラー処理が行われること`,
      async ({ status, errorText }) => {
        mockPatch.mockResolvedValueOnce({
          status,
          ok: false,
          json: async () => ({
            success: false,
            error: errorText,
          }),
        })

        const { result, mockInvalidateQueries } = renderUpdateBookmark()

        result.current.mutate(updatedPayload)

        await waitFor(() => {
          expectMutationError({
            result,
            errorText,
            mockShowErrorMessage,
            mockInvalidateQueries,
          })
        })
      },
    )

    it(`APIが不明なエラーを返したときにエラー処理が行われること`, async () => {
      mockPatch.mockResolvedValueOnce({
        status: 500,
        ok: false,
        json: async () => ({
          success: false,
        }),
      })

      const { result, mockInvalidateQueries } = renderUpdateBookmark()

      result.current.mutate(updatedPayload)

      await waitFor(() => {
        expectMutationError({
          result,
          errorText: ERROR_MESSAGE.FAILED_UPDATE_BOOKMARK,
          mockShowErrorMessage,
          mockInvalidateQueries,
        })
      })
    })
  })
})
