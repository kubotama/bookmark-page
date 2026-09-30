import { renderHook, waitFor } from '@testing-library/react'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, it, vi } from 'vitest'

import {
  INVALID_STRING,
  TEST_ERROR_MESSAGE,
} from '../../../functions/test/fixtures'
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
import { useUnassignRelation } from './useUnassignRelation'

const { mockDelete, mockShowErrorMessage } = vi.hoisted(() => ({
  mockDelete: vi.fn(),
  mockShowErrorMessage: vi.fn(),
}))

// Honoクライアントのモック化
vi.mock('hono/client', () => ({
  hc: () => ({
    api: {
      bookmarks: {
        ':bookmark_id': {
          keywords: {
            ':keyword_id': {
              $delete: mockDelete,
            },
          },
        },
      },
    },
  }),
}))

// notification モジュールのモック化を追加
vi.mock('../../lib/notification', () => ({
  showErrorMessage: mockShowErrorMessage,
}))

const renderUnassignRelation = () => {
  const { mockInvalidateQueries, wrapper } = createTestQueryClient()
  const { result } = renderHook(() => useUnassignRelation(), { wrapper })
  return { mockInvalidateQueries, result }
}

describe('useUnassignRelation', () => {
  const prepareIds = (ids?: { bookmark_id?: string; keyword_id?: string }) => {
    return {
      bookmark_id: ids?.bookmark_id ?? uuidv7(),
      keyword_id: ids?.keyword_id ?? uuidv7(),
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'alert').mockImplementation(() => {}) // alertのポップアップを抑制
  })
  it('正常に関連付け解除 API を呼び出し、クエリキャッシュを無効化すること', async () => {
    mockDelete.mockResolvedValue({
      ok: true,
      status: 204,
    })

    const { mockInvalidateQueries, result } = renderUnassignRelation()

    const { bookmark_id, keyword_id } = prepareIds()

    result.current.mutate({ bookmark_id, keyword_id })

    await waitFor(() => {
      expectMutationSuccess({
        mockInvalidateQueries,
        mockMutation: mockDelete,
        mockShowErrorMessage,
        payload: {
          param: { bookmark_id, keyword_id },
        },
        queryKey: ['bookmarks', 'keywords'],
        result,
      })
    })
  })

  describe('異常系', () => {
    type TestCase = {
      errorName: string
      expectedMessage: string
      param?: { bookmark_id?: string; keyword_id?: string }
      status: number
    }

    const testCases: TestCase[] = [
      {
        errorName: 'ブックマークidが空文字',
        expectedMessage: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
        param: { bookmark_id: '' },
        status: 400,
      },
      {
        errorName: 'ブックマークidが不正な形式',
        expectedMessage: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
        param: { bookmark_id: INVALID_STRING.ID },
        status: 400,
      },
      {
        errorName: '指定されたidのブックマークが存在しない',
        expectedMessage: UI_MESSAGES.API.NOT_FOUND_BOOKMARK,
        status: 404,
      },
      {
        errorName: 'キーワードidが空文字',
        expectedMessage: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
        param: { keyword_id: '' },
        status: 400,
      },
      {
        errorName: 'キーワードidが不正な形式',
        expectedMessage: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
        param: { keyword_id: INVALID_STRING.ID },
        status: 400,
      },
      {
        errorName: '指定されたidのキーワードが存在しない',
        expectedMessage: UI_MESSAGES.API.NOT_FOUND_KEYWORD,
        status: 404,
      },
      {
        errorName: 'データベースなどのエラーが発生した',
        expectedMessage: ERROR_MESSAGE.SERVER_ERROR,
        status: 500,
      },
    ]

    it.each(testCases)(
      `$errorName`,
      async ({ expectedMessage, param, status }) => {
        mockDelete.mockResolvedValueOnce({
          json: async () => ({
            error: expectedMessage,
            success: false,
          }),
          ok: false,
          status: status,
        })

        const { mockInvalidateQueries, result } = renderUnassignRelation()

        const { bookmark_id, keyword_id } = prepareIds(param)

        result.current.mutate({ bookmark_id, keyword_id })

        await waitFor(() => {
          expectMutationError({
            errorText: expectedMessage,
            mockInvalidateQueries,
            mockShowErrorMessage,
            result,
          })
        })
      },
    )

    it('APIのエラーレスポンスにエラーメッセージが含まれない場合、デフォルトエラーメッセージが表示されること', async () => {
      mockDelete.mockResolvedValueOnce({
        json: async () => ({
          success: false,
        }),
        ok: false,
        status: 500,
      })

      const { mockInvalidateQueries, result } = renderUnassignRelation()

      const { bookmark_id, keyword_id } = prepareIds()

      result.current.mutate({ bookmark_id, keyword_id })

      await waitFor(() => {
        expectMutationError({
          errorText: ERROR_MESSAGE.FAILED_UNASSIGN_RELATION,
          mockInvalidateQueries,
          mockShowErrorMessage,
          result,
        })
      })
    })

    it('APIの呼び出しで例外が発生した', async () => {
      const error = new Error(TEST_ERROR_MESSAGE.API_ERROR)
      mockDelete.mockRejectedValue(error)

      const { mockInvalidateQueries, result } = renderUnassignRelation()

      const { bookmark_id, keyword_id } = prepareIds()

      result.current.mutate({ bookmark_id, keyword_id })

      await waitFor(() => {
        expectMutationError({
          errorText: TEST_ERROR_MESSAGE.API_ERROR,
          mockInvalidateQueries,
          mockShowErrorMessage,
          result,
        })
      })
    })
  })
})
