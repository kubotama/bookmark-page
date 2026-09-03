import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TestKeywords } from '../../../functions/test/fixtures'
import { UI_LABELS } from '../../../shared/constants/uiMessages'
import { inputText } from '../../test/test-utils'
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

vi.mock('./useKeywords', () => ({
  useKeywords: () => ({ data: { data: [] } }),
}))

const mockUpdate = vi.fn()
const mockIsUpdatePending = false

vi.mock('./useUpdateKeyword', () => ({
  useUpdateKeyword: () => ({
    isPending: mockIsUpdatePending,
    mutate: mockUpdate,
  }),
}))

describe('キーワードの更新', () => {
  const testKeyword = TestKeywords[0]

  it('更新ボタンをクリックしたらupdateKeyword()が呼び出されること', async () => {
    const user = userEvent.setup()

    render(<KeywordPage keyword={testKeyword} />)

    await inputText(user, UI_LABELS.FIELDS.KEYWORD_NAME, TestKeywords[1].name)

    await user.click(
      await screen.findByRole('button', {
        name: UI_LABELS.ACTIONS.UPDATE,
      }),
    )

    // 検証: フックの削除関数が、正しいIDを引数にして呼ばれたか
    expect(mockUpdate).toHaveBeenCalledWith({
      id: testKeyword.id,
      name: TestKeywords[1].name,
    })
  })
})
