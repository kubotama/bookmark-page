import { expect, Mock, vi } from 'vitest'
import {
  QueryClient,
  QueryClientProvider,
  UseMutationResult,
} from '@tanstack/react-query'
import { UpdateBookmarkPayload } from '../../functions/schemas/bookmark'

type ErrorResultType =
  | {
      current: UseMutationResult<
        | { success: boolean; error: string }
        | {
            readonly success: true
            readonly data: { id: string; title: string; url: string }
          },
        Error,
        UpdateBookmarkPayload,
        unknown
      >
    }
  | { current: UseMutationResult<void, Error, string, unknown> }

interface ExpectMutationErrorOptions {
  result: ErrorResultType
  errorText: string
  mockShowErrorMessage: Mock
  mockNavigate?: Mock
  mockInvalidateQueries?: Mock
}

/**
 * Mutationフックでエラーが発生した際の共通アサーションヘルパー
 */
export const expectMutationError = ({
  result,
  errorText,
  mockShowErrorMessage,
  mockNavigate,
  mockInvalidateQueries,
}: ExpectMutationErrorOptions) => {
  // 1. フックのエラー状態の検証
  expect(result.current.isError).toBe(true)
  expect(result.current.error).toBeInstanceOf(Error)
  expect(result.current.error?.message).toBe(errorText)

  // 2. サイドエフェクトの検証
  expect(mockShowErrorMessage).toHaveBeenCalledWith(errorText)

  if (mockNavigate) {
    expect(mockNavigate).not.toHaveBeenCalled()
  }
  if (mockInvalidateQueries) {
    expect(mockInvalidateQueries).not.toHaveBeenCalled()
  }
}

export const createTestQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // キャッシュがテスト間で残るのを防ぐ
      },
      mutations: { retry: false },
    },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const mockInvalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')

  return { wrapper, mockInvalidateQueries }
}
