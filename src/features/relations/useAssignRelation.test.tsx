import { renderHook, waitFor } from '@testing-library/react'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, it, vi } from 'vitest'

import { SCHEMA_MESSAGE } from '../../../shared/constants/validation'
import {
  createTestQueryClient,
  expectMutationError,
  expectMutationSuccess,
} from '../../test/test-utils'
import { useAssignRelation } from './useAssignRelation'

const { mockPost, mockShowErrorMessage } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockShowErrorMessage: vi.fn(),
}))

// Honoクライアントのモック化
vi.mock('hono/client', () => ({
  hc: () => ({
    api: {
      bookmarks: {
        ':bookmark_id': {
          keywords: {
            $post: mockPost,
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

const renderAssignRelation = () => {
  const { mockInvalidateQueries, wrapper } = createTestQueryClient()
  const { result } = renderHook(() => useAssignRelation(), { wrapper })
  return { mockInvalidateQueries, result }
}

describe('useAssignRelation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'alert').mockImplementation(() => {}) // alertのポップアップを抑制
  })
  const id = uuidv7()
  const bookmark_id = uuidv7()
  const keyword_id = uuidv7()
  const assignReturn = {
    bookmark_id,
    id,
    keyword_id,
  }
  const assignParam = {
    bookmark_id,
    keyword_id,
  }

  describe('正常系', () => {
    it('POST /bookmarks/:bookmark_id/keywords {keyword_id: string}が正しく呼び出されて、ブックマークとキーワードのキャッシュがどちらも無効になること', async () => {
      mockPost.mockResolvedValue({
        json: async () => ({
          data: assignReturn,
          success: true,
        }),
        ok: true,
        status: 200,
      })

      const { mockInvalidateQueries, result } = renderAssignRelation()

      result.current.mutate({ bookmark_id, keyword_id })

      await waitFor(() => {
        expectMutationSuccess({
          mockInvalidateQueries,
          mockMutation: mockPost,
          mockShowErrorMessage,
          payload: {
            json: {
              keyword_id,
            },
            param: { bookmark_id },
          },
          queryKey: ['bookmarks', 'keywords'],
          result,
        })
      })
    })
  })

  describe('異常系', () => {
    type TestCase = {
      errorName: string
      expectedMessage: string
      status: number
    }

    const testCases: TestCase[] = [
      {
        errorName: 'ブックマークidが指定されていない',
        expectedMessage: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
        status: 400,
      },
    ]
    it.each(testCases)(`$errorName`, async ({ expectedMessage, status }) => {
      mockPost.mockResolvedValueOnce({
        json: async () => ({
          error: expectedMessage,
          success: false,
        }),
        ok: false,
        status: status,
      })

      const { mockInvalidateQueries, result } = renderAssignRelation()

      result.current.mutate(assignParam)

      await waitFor(() => {
        expectMutationError({
          errorText: expectedMessage,
          mockInvalidateQueries,
          mockShowErrorMessage,
          result,
        })
      })
    })
  })

  it('ブックマークidが不正な形式', () => {})
  it('指定されたidのブックマークが存在しない', () => {})
  it('キーワードidが指定されていない', () => {})
  it('キーワードidが不正な形式', () => {})
  it('指定されたidのキーワードが存在しない', () => {})
  it('指定されたブックマークとキーワードの関連付けが既に登録されている', () => {})
  it('データベースなどのエラーが発生した', () => {})
  it('APIの呼び出しで例外が発生した', () => {})
})
