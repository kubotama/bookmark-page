import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  TestBookmarkWithKeywords,
  TestKeywords,
} from '../../../functions/test/fixtures'
import { ERROR_MESSAGE, UI_LABELS } from '../../../shared/constants/uiMessages'
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

vi.mock('../bookmark/useBookmarks', () => ({
  useBookmarks: () => {
    return { data: { data: TestBookmarkWithKeywords, success: true } }
  },
}))

vi.mock('../relations/useUnassignRelation', () => ({
  useUnassignRelation: () => ({ isPending: false, mutate: vi.fn() }),
}))

let mockIsPending: boolean = false
const mockAssignRelationMutate = vi.fn()
vi.mock('../relations/useAssignRelation', () => ({
  useAssignRelation: () => ({
    isPending: mockIsPending,
    mutate: mockAssignRelationMutate,
  }),
}))

describe('ブックマークとキーワードの関連付け', () => {
  const testKeyword = TestKeywords[0]
  // let user: UserEvent
  const testBookmark = TestBookmarkWithKeywords[0]
  const id = uuidv7()

  beforeEach(() => {
    vi.clearAllMocks()
    mockAssignRelationMutate.mockReturnValue({
      data: {
        data: { bookmark_id: testBookmark.id, id, keyword_id: testKeyword.id },
        success: true,
      },
    })
    mockIsPending = false
  })

  describe('正常系', () => {
    describe('クリックでブックマークを関連付け', () => {
      it('関連付けられていないブックマークをクリック', async () => {
        const user = userEvent.setup()

        render(<KeywordPage keyword={testKeyword} />)

        const unassignedBookmark = screen.getByTestId(
          `unassigned-bookmark-item-${TestBookmarkWithKeywords[1].id}`,
        )

        await user.click(unassignedBookmark)

        expect(mockAssignRelationMutate).toHaveBeenCalledWith({
          bookmark_id: TestBookmarkWithKeywords[1].id,
          keyword_id: testKeyword.id,
        })
      })

      it('ブックマークのリンクをクリックしても関連付けられない', async () => {
        const user = userEvent.setup()

        render(<KeywordPage keyword={testKeyword} />)

        const bookmarkLink = screen.getByRole('link', {
          name: TestBookmarkWithKeywords[1].title,
        })

        await user.click(bookmarkLink)

        expect(mockAssignRelationMutate).toHaveBeenCalledTimes(0)
      })

      it('関連付け処理中（isAssignRelationPending: true）のときは、クリックしても API が呼び出されないこと', async () => {
        mockIsPending = true

        const user = userEvent.setup()
        render(<KeywordPage keyword={testKeyword} />)

        const unassignedBookmarks = screen.getByTestId(
          `unassigned-bookmark-item-${TestBookmarkWithKeywords[1].id}`,
        )

        await user.click(unassignedBookmarks)

        // API 呼び出し関数が実行されていないことを検証
        expect(mockAssignRelationMutate).not.toHaveBeenCalled()
      })

      it('関連付け処理中は要素に aria-disabled や非活性クラスが付与されていること', () => {
        mockIsPending = true

        render(<KeywordPage keyword={testKeyword} />)

        const unassignedBookmark = screen.getByTestId(
          `unassigned-bookmark-item-${TestBookmarkWithKeywords[1].id}`,
        )

        expect(unassignedBookmark).toHaveAttribute('aria-disabled', 'true')
        expect(unassignedBookmark).toHaveClass(
          'pointer-events-none',
          'opacity-50',
        )
      })
    })
  })

  describe('異常系', () => {
    describe('API エラー発生時の表示（エラーハンドリング）', () => {
      it('assignRelation が失敗した場合でも、コンポーネントがクラッシュせず描画が維持されること', async () => {
        const user = userEvent.setup()
        // 1. API 呼出失敗（onError の発火）をシミュレート
        mockAssignRelationMutate.mockImplementationOnce((_, options) => {
          options?.onError?.(new Error(ERROR_MESSAGE.FAILED_ASSIGN_RELATION))
        })

        render(<KeywordPage keyword={testKeyword} />)

        const unassignedBookmark = screen.getByTestId(
          `unassigned-bookmark-item-${TestBookmarkWithKeywords[1].id}`,
        )

        await user.click(unassignedBookmark)

        // 3. API 呼び出し（mutate）自体は試みられたことを検証
        expect(mockAssignRelationMutate).toHaveBeenCalled()

        // 4. エラー発生後もコンポーネントがクラッシュせずに画面が正常に維持されていることを検証
        expect(
          screen.getByText(UI_LABELS.FIELDS.ASSIGNED_BOOKMARK),
        ).toBeInTheDocument()
      })
    })
  })
})
