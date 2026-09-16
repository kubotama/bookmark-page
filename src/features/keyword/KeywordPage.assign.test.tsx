import { fireEvent, render, screen, within } from '@testing-library/react'
// import userEvent, { UserEvent } from '@testing-library/user-event'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  TestBookmarkWithKeywords,
  TestKeywords,
} from '../../../functions/test/fixtures'
import { UI_LABELS } from '../../../shared/constants/uiMessages'
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

const mockUseAssignRelation = vi.fn()
vi.mock('../relations/useAssignRelation', () => ({
  useAssignRelation: () => ({
    isPending: false,
    mutate: mockUseAssignRelation,
  }),
}))

describe('ブックマークとキーワードの関連付け', () => {
  const testKeyword = TestKeywords[0]
  // let user: UserEvent
  const testBookmark = TestBookmarkWithKeywords[0]
  const id = uuidv7()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAssignRelation.mockReturnValue({
      data: {
        data: { bookmark_id: testBookmark.id, id, keyword_id: testKeyword.id },
        success: true,
      },
    })
    // user = userEvent.setup()
  })

  describe('正常系', () => {
    describe('初期表示・ドラッグ属性の確認', () => {
      it('関連付けられていないブックマーク一覧の各要素に、draggable="true" 属性が付与されていること', async () => {
        render(<KeywordPage keyword={testKeyword} />)

        const unassignedSection = screen.getByText(
          UI_LABELS.FIELDS.UNASSIGNED_BOOKMARK,
        ).parentElement!
        const items = within(unassignedSection).getAllByTestId(
          'unassigned-bookmark-item',
        )

        expect(items.length).toBeGreaterThan(0)
        items.forEach((item) => {
          expect(item).toHaveAttribute('draggable', 'true')
        })
      })
    })
    describe('ドラッグ開始（dragstart）', () => {
      it('未関連付けブックマークをドラッグ開始した際、dataTransfer.setData("text/plain", bookmark.id) で対象のブックマーク ID が正しくセットされること', () => {
        render(<KeywordPage keyword={testKeyword} />)

        const unassignedBookmark = screen.getByText(
          TestBookmarkWithKeywords[1].title,
        )

        // dataTransfer.setData のモック関数を用意
        const setDataMock = vi.fn()

        // dragStart イベントを発火
        fireEvent.dragStart(unassignedBookmark, {
          dataTransfer: {
            setData: setDataMock,
          },
        })

        expect(setDataMock).toHaveBeenCalledWith(
          'text/plain',
          TestBookmarkWithKeywords[1].id,
        )
      })
    })

    describe('ドラッグ中・ホバー時の UI フィードバック（dragenter / dragleave / dragover）', () => {
      it('ドロップ領域上にドラッグ要素が入ったとき（dragenter）、枠線や背景のハイライト用クラスが適用されること', () => {
        render(<KeywordPage keyword={testKeyword} />)

        const dropTarget = screen.getByText(UI_LABELS.FIELDS.ASSIGNED_BOOKMARK)
          .nextElementSibling as HTMLElement

        // dragenter 前は通常スタイル
        expect(dropTarget).toHaveClass('border-slate-500')
        expect(dropTarget).not.toHaveClass('border-indigo-500')

        // dragenter 発火
        fireEvent.dragEnter(dropTarget)

        // ハイライト用クラスが適用されること
        expect(dropTarget).toHaveClass('border-indigo-500')
        expect(dropTarget).toHaveClass('bg-indigo-50/50')
      })

      it('ドロップ領域からドラッグ要素が出たとき（dragleave）、ハイライト用クラスが解除されること', () => {
        render(<KeywordPage keyword={testKeyword} />)

        const dropTarget = screen.getByText(UI_LABELS.FIELDS.ASSIGNED_BOOKMARK)
          .nextElementSibling as HTMLElement

        // 1. 一度進入してハイライト状態にする
        fireEvent.dragEnter(dropTarget)
        expect(dropTarget).toHaveClass('border-indigo-500')

        // 2. 離脱する（dragleave 発火）
        fireEvent.dragLeave(dropTarget)

        // ハイライト用クラスが解除され、デフォルトに戻ること
        expect(dropTarget).not.toHaveClass('border-indigo-500')
        expect(dropTarget).not.toHaveClass('bg-indigo-50/50')
        expect(dropTarget).toHaveClass('border-slate-500')
      })

      it('ドロップ領域上で dragover が発生した際、デフォルト動作をキャンセルしてドロップが許可されること（preventDefault の実行）', () => {
        render(<KeywordPage keyword={testKeyword} />)

        const dropTarget = screen.getByText(UI_LABELS.FIELDS.ASSIGNED_BOOKMARK)
          .nextElementSibling as HTMLElement

        const isDefaultPrevented = !fireEvent.dragOver(dropTarget)
        expect(isDefaultPrevented).toBe(true)
      })
    })

    describe('ドロップ完了と API 呼び出し（drop）', () => {
      it('ドロップ領域にドロップした際、dataTransfer.getData("text/plain") から取得したブックマーク ID を使い、assignRelation が正しい引数（bookmark_id, keyword_id）で呼び出されること', async () => {})
      it('ドロップ完了後、ドロップ領域のハイライト表示が解除されること', async () => {})
    })
  })

  describe('異常系', () => {
    describe('無効なデータのドロップ（ID が空・不正な場合）', () => {
      it('dataTransfer にブックマーク ID が存在しない（空文字または null）状態でドロップされた場合、assignRelation が呼び出されないこと', async () => {})
    })
    describe('対象外要素のドラッグ抑止', () => {
      it('すでに「関連付けられているブックマーク」 の要素には draggable 属性が付与されておらず、ドラッグできないこと', async () => {})
    })
    describe('ドロップ領域外へのドロップ（操作のキャンセル）', () => {
      it('関連付け領域以外の場所（画面の余白や別の要素など）にドロップされた場合、assignRelation が呼び出されないこと', async () => {})
      it('外へドロップしてキャンセルされた後、ドロップ領域にハイライトが残っていないこと', async () => {})
    })
    describe('API エラー発生時の表示（エラーハンドリング）', () => {
      it('assignRelation が失敗（400 / 409 / 500 など）を返した場合でも、コンポーネントがクラッシュせず、エラーメッセージ表示処理（showErrorMessage など）が実行されること', async () => {})
    })
    describe('処理中（Pending）の多重操作制御（※実装する場合）', () => {
      it('関連付け処理が完了するまでの間（isPending 時）、二重ドロップや意図しない連続リクエストが防止されていること', async () => {})
    })
  })
})
