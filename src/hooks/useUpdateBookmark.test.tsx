import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TestBookmarks } from '../../functions/test/fixtures'
import { useUpdateBookmark } from './useUpdateBookmark'
import { ERROR_MESSAGE, UI_MESSAGES } from '../../shared/constants/uiMessages'
import { SCHEMA_MESSAGE } from '../../shared/constants/validation'

const { mockPatch } = vi.hoisted(() => ({
  mockPatch: vi.fn(),
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

const createTestQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, wrapper }
}

describe('useUpdateBookmark', () => {
  const validId = uuidv7()

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('更新APIが200を返したときにキャッシュが更新されること', async () => {
    const updatedPayload = {
      id: validId,
      title: TestBookmarks[0].title,
      url: TestBookmarks[0].url,
    }
    mockPatch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        success: true,
        data: updatedPayload,
      }),
    })

    const { queryClient, wrapper } = createTestQueryClient()
    // 💡 本物の queryClient の invalidateQueries を spyOn する
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateBookmark(), { wrapper })

    result.current.mutate(updatedPayload)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)

      expect(mockPatch).toHaveBeenCalledWith({
        param: { id: validId },
        json: {
          title: updatedPayload.title,
          url: updatedPayload.url,
        },
      })

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['bookmarks'],
      })
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
        const updatedPayload = {
          id: validId,
          title: TestBookmarks[0].title,
          url: TestBookmarks[0].url,
        }
        const { queryClient, wrapper } = createTestQueryClient()
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

        const { result } = renderHook(() => useUpdateBookmark(), { wrapper })

        result.current.mutate(updatedPayload)

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(false)
          expect(result.current.error).toBeInstanceOf(Error)
          expect(result.current.error?.message).toBe(errorText)

          expect(invalidateSpy).not.toHaveBeenCalled()
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
      const updatedPayload = {
        id: validId,
        title: TestBookmarks[0].title,
        url: TestBookmarks[0].url,
      }
      const { queryClient, wrapper } = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useUpdateBookmark(), { wrapper })

      result.current.mutate(updatedPayload)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(false)
        expect(result.current.error).toBeInstanceOf(Error)
        expect(result.current.error?.message).toBe(
          ERROR_MESSAGE.FAILED_UPDATE_BOOKMARK,
        )

        expect(invalidateSpy).not.toHaveBeenCalled()
      })
    })
  })
})
