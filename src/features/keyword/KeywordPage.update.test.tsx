import { render, screen } from '@testing-library/react'
import userEvent, { UserEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TEST_STRING, TestKeywords } from '../../../functions/test/fixtures'
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

const mockUseKeywords = vi.fn()
vi.mock('../keyword/useKeywords', () => ({
  useKeywords: () => mockUseKeywords(),
}))

const mockUpdate = vi.fn()
const mockIsUpdatePending = false

vi.mock('./useUpdateKeyword', () => ({
  useUpdateKeyword: () => ({
    isPending: mockIsUpdatePending,
    mutate: mockUpdate,
  }),
}))

vi.mock('./useDeleteKeyword', () => ({
  useDeleteKeyword: () => ({ isPending: false, mutate: vi.fn() }),
}))

describe('キーワードの更新', () => {
  const testKeyword = TestKeywords[0]
  let user: UserEvent

  beforeEach(() => {
    vi.resetAllMocks()
    // 全キーワードとして TestKeywords を返すように設定
    mockUseKeywords.mockReturnValue({
      data: { data: TestKeywords, success: true },
    })
    user = userEvent.setup()
  })

  it('更新ボタンをクリックしたらupdateKeyword()が呼び出されること', async () => {
    render(<KeywordPage keyword={testKeyword} />)

    await inputText(
      user,
      UI_LABELS.FIELDS.KEYWORD_NAME,
      TEST_STRING.NEW_KEYWORD,
    )

    await user.click(
      await screen.findByRole('button', {
        name: UI_LABELS.ACTIONS.UPDATE,
      }),
    )

    // 検証: フックの削除関数が、正しいIDを引数にして呼ばれたか
    expect(mockUpdate).toHaveBeenCalledWith({
      id: testKeyword.id,
      name: TEST_STRING.NEW_KEYWORD,
    })
  })

  it('文字列が空の場合には無効になること', async () => {
    render(<KeywordPage keyword={testKeyword} />)

    await inputText(user, UI_LABELS.FIELDS.KEYWORD_NAME, '')

    const updateButton = await screen.findByRole('button', {
      name: UI_LABELS.ACTIONS.UPDATE,
    })

    expect(updateButton).toBeDisabled()
  })

  it('既に登録済みの文字列の場合には登録済にラベルが変更されて無効になること', async () => {
    render(<KeywordPage keyword={testKeyword} />)

    await inputText(user, UI_LABELS.FIELDS.KEYWORD_NAME, TestKeywords[1].name)

    const updateButton = await screen.findByRole('button', {
      name: UI_LABELS.ACTIONS.KEYWORD_REGISTERED,
    })

    expect(updateButton).toBeDisabled()
  })
})
