import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import { UserEvent } from '@testing-library/user-event'
import { expect, Mock, vi } from 'vitest'

interface ExpectMutationSuccessOptions {
  mockInvalidateQueries?: Mock
  mockMutation: Mock
  mockShowErrorMessage?: Mock
  navigate?: { mockNavigate: Mock; path: string }
  payload: {
    json?: { name: string } | { title: string; url: string }
    param?: { id: string }
  }
  queryKey: string[]
  result: ResultType
}

type ResultType = {
  current: {
    error: Error | null
    isSuccess: boolean
  }
}

export const expectMutationSuccess = ({
  mockInvalidateQueries,
  mockMutation,
  mockShowErrorMessage,
  navigate,
  payload,
  queryKey,
  result,
}: ExpectMutationSuccessOptions) => {
  expect(result.current.isSuccess).toBe(true)
  // // 検証: 正しいIDでAPIが呼ばれたか
  expect(mockMutation).toHaveBeenCalledWith(payload)
  // // 検証: キャッシュ更新(invalidate)が走ったか
  if (mockInvalidateQueries) {
    queryKey.forEach((key) =>
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: [key],
      }),
    )
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
  errorText: string
  mockInvalidateQueries?: Mock
  mockNavigate?: Mock
  mockShowErrorMessage: Mock
  result: ResultType
}

/**
 * Mutationフックでエラーが発生した際の共通アサーションヘルパー
 */
export const expectMutationError = ({
  errorText,
  mockInvalidateQueries,
  mockNavigate,
  mockShowErrorMessage,
  result,
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
      mutations: { retry: false },
      queries: {
        gcTime: 0, // キャッシュがテスト間で残るのを防ぐ
        retry: false,
      },
    },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const mockInvalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')

  return { mockInvalidateQueries, wrapper }
}

export const clickButton = async (user: UserEvent, label: string) => {
  const button = await screen.findByRole('button', { name: label })
  await user.click(button)
  return button
}

export const inputText = async (
  user: UserEvent,
  label: string,
  text: string | undefined,
) => {
  const input = await screen.findByRole('textbox', { name: label })
  await user.clear(input)
  if (text) {
    await user.type(input, text)
  }
}

type TextTestType = {
  disabled?: boolean
  link?: string
  text: string
}

export const expectText = async (textTest: TextTestType) => {
  const linkItem = await screen.findByText(textTest.text)
  expect(linkItem).toBeInTheDocument()
  if (textTest.link)
    expect(linkItem.closest('a')).toHaveAttribute('href', textTest.link)
  if (textTest.disabled === true) {
    expect(linkItem).toBeDisabled()
  } else if (textTest.disabled === false) {
    expect(linkItem).toBeEnabled()
  }
}
