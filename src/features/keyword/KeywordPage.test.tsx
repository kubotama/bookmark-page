import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TestKeywords } from '../../../functions/test/fixtures'
import { UI_LABELS } from '../../../shared/constants/uiMessages'
import { clickButton } from '../../test/test-utils'
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

vi.mock('./useUpdateKeyword', () => ({
  useUpdateKeyword: () => ({
    isPending: false,
    mutate: vi.fn(),
  }),
}))

describe('KeywordPage', () => {
  it('キーワードの名前が正しく表示されていること', async () => {
    // arrange
    const targetKeyword = TestKeywords[0]

    // act - キーワードの詳細ページのレンダリング
    render(<KeywordPage key={targetKeyword.id} keyword={targetKeyword} />)

    // assert - キーワードの名前がテキストボックスで表示されていること
    const keywordName = await screen.findByRole('textbox', {
      name: UI_LABELS.FIELDS.KEYWORD_NAME,
    })
    expect(keywordName).toHaveValue(targetKeyword.name)
  })

  it('ボタンが表示されること', async () => {
    // arrange
    const targetKeyword = TestKeywords[0]

    // act - キーワードの詳細ページのレンダリング
    render(<KeywordPage key={targetKeyword.id} keyword={targetKeyword} />)

    // assert - 開く、更新、削除ボタンが表示されること
    expect(
      await screen.findByRole('button', { name: UI_LABELS.ACTIONS.OPEN }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: UI_LABELS.ACTIONS.UPDATE }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: UI_LABELS.ACTIONS.DELETE }),
    ).toBeInTheDocument()
  })

  describe('戻るボタンの動作', () => {
    beforeEach(() => {
      vi.resetAllMocks()
      mockHistoryLength = 2
    })

    const testKeyword = TestKeywords[0]

    it('履歴が存在する場合（window.history.length > 1）、router.history.back が呼び出されること', async () => {
      mockHistoryLength = 2
      const user = userEvent.setup()

      render(<KeywordPage keyword={testKeyword} />)

      await clickButton(user, UI_LABELS.ACTIONS.BACK)

      // 💡 2. router.history.back が呼ばれ、navigate は呼ばれていないことを検証
      expect(mockBack).toHaveBeenCalledTimes(1)
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('履歴が存在しない場合、戻るボタンが無効になること', async () => {
      mockHistoryLength = 1

      render(<KeywordPage keyword={testKeyword} />)

      const backButton = await screen.findByRole('button', {
        name: UI_LABELS.ACTIONS.BACK,
      })
      expect(backButton).toBeDisabled()
    })
  })
})
