import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TestKeywords } from '../../../functions/test/fixtures'
import { UI_LABELS, UI_MESSAGES } from '../../../shared/constants/uiMessages'
import { clickButton } from '../../test/test-utils'
import { KeywordPage } from './KeywordPage'

vi.mock('@tanstack/react-router', () => ({
  Link: vi.fn(),
  useRouter: () => ({ history: { back: vi.fn() }, navigate: vi.fn() }),
}))

const mockDelete = vi.fn()
let mockIsPending = false

vi.mock('./useDeleteKeyword', () => ({
  useDeleteKeyword: () => ({
    isPending: mockIsPending,
    mutate: mockDelete,
  }),
}))

vi.mock('./useUpdateKeyword', () => ({
  useUpdateKeyword: () => ({ isPending: false, mutate: vi.fn() }),
}))

vi.mock('./useKeywords', () => ({
  useKeywords: () => ({ data: { data: [] } }),
}))

describe('削除ボタンの動作', () => {
  const testKeyword = TestKeywords[0]

  beforeEach(() => {
    vi.resetAllMocks()
    mockIsPending = false // ローディング状態をデフォルトに戻す
  })

  // -------------------------------------------------------------
  // ケース1: 確認ダイアログで「OK」を選んだとき
  // -------------------------------------------------------------
  it('削除ボタンを押し、ダイアログでOKを押した場合、deleteKeywordが実行されること', async () => {
    const user = userEvent.setup()

    // 💡 window.confirm が呼び出されたら「true（OK）」を返すように偽装
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<KeywordPage keyword={testKeyword} />)

    await clickButton(user, UI_LABELS.ACTIONS.DELETE)

    // 検証: 確認ダイアログが正しい文言で開かれたか
    expect(confirmSpy).toHaveBeenCalledWith(
      UI_MESSAGES.KEYWORDS.CONFIRM_DELETE(testKeyword.name),
    )
    // 検証: フックの削除関数が、正しいIDを引数にして呼ばれたか
    expect(mockDelete).toHaveBeenCalledWith(testKeyword.id)
  })

  // -------------------------------------------------------------
  // ケース2: 確認ダイアログで「キャンセル」を選んだとき
  // -------------------------------------------------------------
  it('削除ボタンを押し、ダイアログでキャンセルを押した場合、削除処理が中断されること', async () => {
    const user = userEvent.setup()

    // 💡 window.confirm が呼び出されたら「false（キャンセル）」を返すように偽装
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(<KeywordPage keyword={testKeyword} />)

    await clickButton(user, UI_LABELS.ACTIONS.DELETE)

    // 検証: 削除関数が呼び出されていないこと
    expect(mockDelete).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------
  // ケース3: 削除通信中（isPending = true）のとき
  // -------------------------------------------------------------
  it('削除処理中（isPendingがtrue）の場合、ボタンが非活性になること', () => {
    // 💡 テストケース実行前にローディング状態を再現
    mockIsPending = true

    render(<KeywordPage keyword={testKeyword} />)

    const deleteButton = screen.getByRole('button', {
      name: UI_LABELS.ACTIONS.DELETE,
    })

    // 検証: ボタンが disabled（非活性）になっていること
    expect(deleteButton).toBeDisabled()
  })
})
