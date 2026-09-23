import { fireEvent, render, screen, within } from '@testing-library/react'
// import userEvent, { UserEvent } from '@testing-library/user-event'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  TestBookmarkWithKeywords,
  TestKeywords,
} from '../../../functions/test/fixtures'
import { DND_DATA_TYPES } from '../../../shared/constants/dnd'
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
          DND_DATA_TYPES.ASSIGN,
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
        fireEvent.dragEnter(dropTarget, {
          dataTransfer: {
            types: [DND_DATA_TYPES.ASSIGN],
          },
        })

        // ハイライト用クラスが適用されること
        expect(dropTarget).toHaveClass('border-indigo-500')
        expect(dropTarget).toHaveClass('bg-indigo-50/50')
      })

      it('ドロップ領域からドラッグ要素が出たとき（dragleave）、ハイライト用クラスが解除されること', () => {
        render(<KeywordPage keyword={testKeyword} />)

        const dropTarget = screen.getByText(UI_LABELS.FIELDS.ASSIGNED_BOOKMARK)
          .nextElementSibling as HTMLElement

        // 1. 一度進入してハイライト状態にする
        fireEvent.dragEnter(dropTarget, {
          dataTransfer: {
            types: [DND_DATA_TYPES.ASSIGN],
          },
        })
        expect(dropTarget).toHaveClass('border-indigo-500')

        // 2. 離脱する（dragleave 発火）
        fireEvent.dragLeave(dropTarget, {
          dataTransfer: {
            types: [DND_DATA_TYPES.ASSIGN],
          },
        })

        // ハイライト用クラスが解除され、デフォルトに戻ること
        expect(dropTarget).not.toHaveClass('border-indigo-500')
        expect(dropTarget).not.toHaveClass('bg-indigo-50/50')
        expect(dropTarget).toHaveClass('border-slate-500')
      })

      it('ドロップ領域上で dragover が発生した際、デフォルト動作をキャンセルしてドロップが許可されること（preventDefault の実行）', () => {
        render(<KeywordPage keyword={testKeyword} />)

        const dropTarget = screen.getByText(UI_LABELS.FIELDS.ASSIGNED_BOOKMARK)
          .nextElementSibling as HTMLElement

        const isDefaultPrevented = !fireEvent.dragOver(dropTarget, {
          dataTransfer: {
            types: [DND_DATA_TYPES.ASSIGN],
          },
        })
        expect(isDefaultPrevented).toBe(true)
      })

      it('ドロップ領域上で dragover が発生した際、dropEffect が "move" に設定されること', () => {
        render(<KeywordPage keyword={testKeyword} />)

        const dropTarget = screen.getByText(UI_LABELS.FIELDS.ASSIGNED_BOOKMARK)
          .nextElementSibling as HTMLElement

        const dataTransfer = {
          dropEffect: '',
          types: [DND_DATA_TYPES.ASSIGN],
        }

        fireEvent.dragOver(dropTarget, { dataTransfer })

        // 💡 dropEffect が 'move' になっていることを検証
        expect(dataTransfer.dropEffect).toBe('move')
      })
    })

    describe('ドロップ完了と API 呼び出し（drop）', () => {
      it('ドロップ領域にドロップした際、dataTransfer.getData("text/plain") から取得したブックマーク ID を使い、assignRelation が正しい引数（bookmark_id, keyword_id）で呼び出されること', () => {
        render(<KeywordPage keyword={testKeyword} />)

        const dropTarget = screen.getByText(UI_LABELS.FIELDS.ASSIGNED_BOOKMARK)
          .nextElementSibling as HTMLElement

        const droppedBookmarkId = TestBookmarkWithKeywords[1].id

        // dragStart / drop 時に使用する dataTransfer のモック
        const getDataMock = vi.fn().mockReturnValue(droppedBookmarkId)

        // drop イベントを発火
        fireEvent.drop(dropTarget, {
          dataTransfer: {
            getData: getDataMock,
            types: [DND_DATA_TYPES.ASSIGN],
          },
        })

        // dataTransfer.getData('text/plain') が呼ばれたこと
        expect(getDataMock).toHaveBeenCalledWith(DND_DATA_TYPES.ASSIGN)

        // assignRelation (mutate) が正しい引数で呼び出されたことを検証
        expect(mockAssignRelationMutate).toHaveBeenCalledWith({
          bookmark_id: droppedBookmarkId,
          keyword_id: testKeyword.id,
        })
      })

      it('ドロップ完了後、ドロップ領域のハイライト表示が解除されること', () => {
        render(<KeywordPage keyword={testKeyword} />)

        const dropTarget = screen.getByText(UI_LABELS.FIELDS.ASSIGNED_BOOKMARK)
          .nextElementSibling as HTMLElement

        // 1. ドラッグ要素が進入してハイライト状態にする
        fireEvent.dragEnter(dropTarget, {
          dataTransfer: {
            types: [DND_DATA_TYPES.ASSIGN],
          },
        })
        expect(dropTarget).toHaveClass('border-indigo-500')

        // 2. ドロップを実行
        fireEvent.drop(dropTarget, {
          dataTransfer: {
            getData: vi.fn().mockReturnValue(TestBookmarkWithKeywords[1].id),
            types: [DND_DATA_TYPES.ASSIGN],
          },
        })

        // 3. ドロップ後にハイライトクラスが解除され、通常スタイルに戻ることを検証
        expect(dropTarget).not.toHaveClass('border-indigo-500')
        expect(dropTarget).not.toHaveClass('bg-indigo-50/50')
        expect(dropTarget).toHaveClass('border-slate-500')
      })
    })
  })

  describe('異常系', () => {
    describe('無効なデータのドロップ（ID が空・不正な場合）', () => {
      it('dataTransfer にブックマーク ID が存在しない（空文字または null）状態でドロップされた場合、assignRelation が呼び出されないこと', () => {
        render(<KeywordPage keyword={testKeyword} />)

        const dropTarget = screen.getByText(UI_LABELS.FIELDS.ASSIGNED_BOOKMARK)
          .nextElementSibling as HTMLElement

        // 空文字を返す getData のモック
        const getDataMock = vi.fn().mockReturnValue('')

        fireEvent.drop(dropTarget, {
          dataTransfer: {
            getData: getDataMock,
            types: [DND_DATA_TYPES.ASSIGN],
          },
        })

        // getData は呼ばれるが、ID が空のため assignRelation (mutate) は呼ばれないこと
        expect(getDataMock).toHaveBeenCalledWith(DND_DATA_TYPES.ASSIGN)
        expect(mockAssignRelationMutate).not.toHaveBeenCalled()
      })
    })
    describe('ドロップ領域外へのドロップ（操作のキャンセル）', () => {
      it('関連付け領域以外の場所（画面の余白や別の要素など）にドロップされた場合、assignRelation が呼び出されないこと', () => {
        render(<KeywordPage keyword={testKeyword} />)

        // ドロップ領域外の要素（例: 画面のヘッダーや body など）
        const outsideElement = document.body

        // 領域外の要素に対して drop イベントを発火
        fireEvent.drop(outsideElement, {
          dataTransfer: {
            getData: vi.fn().mockReturnValue(TestBookmarkWithKeywords[1].id),
            types: [DND_DATA_TYPES.ASSIGN],
          },
        })

        // assignRelation (mutate) が実行されないこと
        expect(mockAssignRelationMutate).not.toHaveBeenCalled()
      })
      it('外へドロップしてキャンセルされた後、ドロップ領域にハイライトが残っていないこと', () => {
        render(<KeywordPage keyword={testKeyword} />)

        const dropTarget = screen.getByText(UI_LABELS.FIELDS.ASSIGNED_BOOKMARK)
          .nextElementSibling as HTMLElement
        const outsideElement = document.body

        // 1. ドロップ領域内に進入してハイライト状態にする (dragenter)
        fireEvent.dragEnter(dropTarget, {
          dataTransfer: {
            types: [DND_DATA_TYPES.ASSIGN],
          },
        })
        expect(dropTarget).toHaveClass('border-indigo-500')

        // 2. ドロップ領域外へ移動する (dragleave)
        fireEvent.dragLeave(dropTarget, {
          dataTransfer: {
            types: [DND_DATA_TYPES.ASSIGN],
          },
        })

        // 3. 領域外の要素上でドロップ（またはドラッグ終了）
        fireEvent.drop(outsideElement, {
          dataTransfer: {},
        })

        // 4. ドロップ領域のハイライトが解除され、デフォルトに戻っていることを検証
        expect(dropTarget).not.toHaveClass('border-indigo-500')
        expect(dropTarget).not.toHaveClass('bg-indigo-50/50')
        expect(dropTarget).toHaveClass('border-slate-500')
      })
    })

    describe('API エラー発生時の表示（エラーハンドリング）', () => {
      it('assignRelation が失敗した場合でも、コンポーネントがクラッシュせず描画が維持されること', () => {
        // 1. API 呼出失敗（onError の発火）をシミュレート
        mockAssignRelationMutate.mockImplementationOnce((_, options) => {
          options?.onError?.(new Error(ERROR_MESSAGE.FAILED_ASSIGN_RELATION))
        })

        render(<KeywordPage keyword={testKeyword} />)

        const dropTarget = screen.getByText(UI_LABELS.FIELDS.ASSIGNED_BOOKMARK)
          .nextElementSibling as HTMLElement

        // 2. ドロップイベントを発火
        fireEvent.drop(dropTarget, {
          dataTransfer: {
            getData: vi.fn().mockReturnValue(TestBookmarkWithKeywords[1].id),
            types: [DND_DATA_TYPES.ASSIGN],
          },
        })

        // 3. API 呼び出し（mutate）自体は試みられたことを検証
        expect(mockAssignRelationMutate).toHaveBeenCalled()

        // 4. エラー発生後もコンポーネントがクラッシュせずに画面が正常に維持されていることを検証
        expect(
          screen.getByText(UI_LABELS.FIELDS.ASSIGNED_BOOKMARK),
        ).toBeInTheDocument()
      })
    })

    describe('処理中（Pending）の多重操作制御（※実装する場合）', () => {
      it('関連付け処理が完了するまでの間（isPending 時）、二重ドロップや意図しない連続リクエストが防止されていること', () => {
        mockIsPending = true

        render(<KeywordPage keyword={testKeyword} />)

        const dropTarget = screen.getByText(UI_LABELS.FIELDS.ASSIGNED_BOOKMARK)
          .nextElementSibling as HTMLElement

        // 2. 処理中の状態のままドロップイベントを発火
        fireEvent.drop(dropTarget, {
          dataTransfer: {
            getData: vi.fn().mockReturnValue(TestBookmarkWithKeywords[1].id),
            types: [DND_DATA_TYPES.ASSIGN],
          },
        })

        // 3. isPending のため、mutate が呼び出されないことを検証
        expect(mockAssignRelationMutate).not.toHaveBeenCalled()
      })
    })
  })
})
