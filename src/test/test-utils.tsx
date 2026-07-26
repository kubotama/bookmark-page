import { expect, Mock, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

type ResultType = {
  current: {
    isSuccess: boolean
    error: Error | null
  }
}

interface ExpectMutationSuccessOptions {
  result: ResultType
  mockMutation: Mock
  payload: { param: { id: string }; json?: { title: string; url: string } }
  navigate?: { mockNavigate: Mock; path: string }
  mockInvalidateQueries?: Mock
  mockShowErrorMessage?: Mock
}

export const expectMutationSuccess = ({
  result,
  mockMutation,
  payload,
  navigate,
  mockInvalidateQueries,
  mockShowErrorMessage,
}: ExpectMutationSuccessOptions) => {
  expect(result.current.isSuccess).toBe(true)
  // // 検証: 正しいIDでAPIが呼ばれたか
  expect(mockMutation).toHaveBeenCalledWith(payload)
  // // 検証: キャッシュ更新(invalidate)が走ったか
  if (mockInvalidateQueries) {
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['bookmarks'],
    })
  }
  // // 検証: 画面遷移したか
  if (navigate) {
    expect(navigate.mockNavigate).toHaveBeenCalledWith({ to: navigate.path })
  }
  if (mockShowErrorMessage) {
    expect(mockShowErrorMessage).not.toHaveBeenCalled()
  }
}

interface ExpectMutationErrorOptions {
  result: ResultType
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
  expect(result.current.isSuccess).toBe(false)
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
