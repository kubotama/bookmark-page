import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TestBookmarks } from '../../functions/test/fixtures'
import { useUpdateBookmark } from './useUpdateBookmark'

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
    it('APIが400でバリデーションエラーを返したときにエラー処理が行われること', () => {})
    it('APIが404でブックマークが存在しないエラーを返したときにエラー処理が行われること', () => {})
    it('APIが409で登録済みのurlを登録しようとしたエラーを返したときにエラー処理が行われること', () => {})
    it('APIが500などの一般的なエラーを返したときにエラー処理が行われること', () => {})
  })
})
