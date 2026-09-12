import { renderHook, waitFor } from '@testing-library/react'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, it, vi } from 'vitest'

import { AssignRelationPayload } from '../../../functions/schemas/relations'
import { INVALID_STRING } from '../../../functions/test/fixtures'
import { UI_MESSAGES } from '../../../shared/constants/uiMessages'
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
  const notexistId = uuidv7()
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
      param?: { bookmark_id?: string; keyword_id?: string }
      status: number
    }

    const testCases: TestCase[] = [
      {
        errorName: 'ブックマークidが指定されていない',
        expectedMessage: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
        param: { keyword_id },
        status: 400,
      },
      {
        errorName: 'ブックマークidが不正な形式',
        expectedMessage: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
        param: { bookmark_id: INVALID_STRING.ID, keyword_id },
        status: 400,
      },
      {
        errorName: '指定されたidのブックマークが存在しない',
        expectedMessage: UI_MESSAGES.API.NOT_FOUND_BOOKMARK,
        param: { bookmark_id: notexistId, keyword_id },
        status: 404,
      },
      {
        errorName: 'キーワードidが指定されていない',
        expectedMessage: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
        param: { bookmark_id },
        status: 400,
      },
      {
        errorName: 'キーワードidが不正な形式',
        expectedMessage: SCHEMA_MESSAGE.INVALID_ID_FORMAT,
        param: { bookmark_id, keyword_id: INVALID_STRING.ID },
        status: 400,
      },
      {
        errorName: '指定されたidのキーワードが存在しない',
        expectedMessage: UI_MESSAGES.API.NOT_FOUND_KEYWORD,
        param: { bookmark_id, keyword_id: notexistId },
        status: 404,
      },
      {
        errorName:
          '指定されたブックマークとキーワードの関連付けが既に登録されている',
        expectedMessage: UI_MESSAGES.API.DUPLICATE_BKRELATION,
        status: 409,
      },
    ]
    it.each(testCases)(
      `$errorName`,
      async ({ expectedMessage, param, status }) => {
        mockPost.mockResolvedValueOnce({
          json: async () => ({
            error: expectedMessage,
            success: false,
          }),
          ok: false,
          status: status,
        })

        const { mockInvalidateQueries, result } = renderAssignRelation()

        result.current.mutate((param ?? assignParam) as AssignRelationPayload)

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
  })

  it('指定されたブックマークとキーワードの関連付けが既に登録されている', () => {})
  it('データベースなどのエラーが発生した', () => {})
  it('APIの呼び出しで例外が発生した', () => {})
})
