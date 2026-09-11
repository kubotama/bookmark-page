import { renderHook, waitFor } from '@testing-library/react'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, it, vi } from 'vitest'

import {
  createTestQueryClient,
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

describe('正常系', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'alert').mockImplementation(() => {}) // alertのポップアップを抑制
  })
  const id = uuidv7()
  const bookmark_id = uuidv7()
  const keyword_id = uuidv7()
  const assingReturn = {
    bookmark_id,
    id,
    keyword_id,
  }

  it('POST /bookmarks/:bookmark_id/keywords {keyword_id: string}が正しく呼び出されて、ブックマークとキーワードのキャッシュがどちらも無効になること', async () => {
    mockPost.mockResolvedValue({
      json: async () => ({
        data: assingReturn,
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
  it('ブックマークidが指定されていない', () => {})
  it('ブックマークidが不正な形式', () => {})
  it('指定されたidのブックマークが存在しない', () => {})
  it('キーワードidが指定されていない', () => {})
  it('キーワードidが不正な形式', () => {})
  it('指定されたidのキーワードが存在しない', () => {})
  it('指定されたブックマークとキーワードの関連付けが既に登録されている', () => {})
  it('データベースなどのエラーが発生した', () => {})
  it('APIの呼び出しで例外が発生した', () => {})
})
