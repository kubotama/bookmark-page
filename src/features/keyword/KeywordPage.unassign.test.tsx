import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  TestBookmarkWithKeywords,
  TestKeywords,
} from '../../../functions/test/fixtures'
import { KeywordPage } from './KeywordPage'

const mockBack = vi.fn()
const mockNavigate = vi.fn()

let mockHistoryLength = 2

vi.mock('@tanstack/react-router', () => ({
  Link: vi.fn(),
  useRouter: () => ({
    history: {
      back: mockBack,
      get length() {
        return mockHistoryLength
      },
    },
    navigate: mockNavigate,
  }),
}))

vi.mock('../keyword/useKeywords', () => ({
  useKeywords: () => {
    return { data: { data: TestKeywords, success: true } }
  },
}))

vi.mock('./useUpdateKeyword', () => ({
  useUpdateKeyword: () => ({ isPending: false, mutate: vi.fn() }),
}))

vi.mock('./useDeleteKeyword', () => ({
  useDeleteKeyword: () => ({ isPending: false, mutate: vi.fn() }),
}))

vi.mock('../relations/useAssignRelation', () => ({
  useAssignRelation: () => ({ isPending: false, mutate: vi.fn() }),
}))

vi.mock('../bookmark/useBookmarks', () => ({
  useBookmarks: () => {
    return { data: { data: TestBookmarkWithKeywords, success: true } }
  },
}))

let mockIsPending: boolean = false
const mockUnassignRelationMutate = vi.fn()
vi.mock('../relations/useUnassignRelation', () => ({
  useUnassignRelation: () => ({
    isPending: mockIsPending,
    mutate: mockUnassignRelationMutate,
  }),
}))

describe('ブックマークとキーワードの関連付けの解除', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUnassignRelationMutate.mockReturnValue({ data: { success: true } })
    mockIsPending = false
  })

  const testKeyword = TestKeywords[0]

  describe('正常系', () => {
    describe('クリックでブックマークとの関連付けを解除', () => {
      it('関連付けられているブックマークをクリック', async () => {
        const user = userEvent.setup()

        render(<KeywordPage keyword={testKeyword} />)

        const assignedBookmark = screen.getByText(
          TestBookmarkWithKeywords[0].title,
        )

        await user.click(assignedBookmark)

        expect(mockUnassignRelationMutate).toHaveBeenCalledWith({
          bookmark_id: TestBookmarkWithKeywords[0].id,
          keyword_id: testKeyword.id,
        })
      })
    })

    it('関連付けの解除処理中（isUnassignRelationPending: true）のときは、クリックしても API が呼び出されないこと', async () => {
      mockIsPending = true

      const user = userEvent.setup()
      render(<KeywordPage keyword={testKeyword} />)

      const assignedBookmark = screen.getByText(
        TestBookmarkWithKeywords[0].title,
      )

      await user.click(assignedBookmark)

      // API 呼び出し関数が実行されていないことを検証
      expect(mockUnassignRelationMutate).not.toHaveBeenCalled()
    })

    it('関連付けの解除処理中は要素に aria-disabled や非活性クラスが付与されていること', () => {
      mockIsPending = true

      render(<KeywordPage keyword={testKeyword} />)

      const assignedBookmarkItems = screen.getAllByTestId(
        'assigned-bookmark-item',
      )
      const targetItem = assignedBookmarkItems[0]

      expect(targetItem).toHaveAttribute('aria-disabled', 'true')
      expect(targetItem).toHaveClass('pointer-events-none', 'opacity-50')
    })
  })
})
