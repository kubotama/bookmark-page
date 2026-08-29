import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TestBookmarkWithKeywords } from '../../functions/test/fixtures'
import { UI_LABELS } from '../../shared/constants/uiMessages'
import { clickButton } from '../test/test-utils'
import { BookmarkForm } from './BookmarkForm'

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

vi.mock('../hooks/useDeleteBookmark', () => ({
  useDeleteBookmark: () => ({ isPending: false, mutate: vi.fn() }),
}))

vi.mock('../hooks/useUpdateBookmark', () => ({
  useUpdateBookmark: () => ({ isPending: false, mutate: vi.fn() }),
}))

vi.mock('../hooks/useKeywords', () => ({
  useKeywords: () => ({ data: { data: [] } }),
}))

vi.mock('../hooks/useAddKeyword', () => ({
  useAddKeyword: () => ({ isPending: false, mutate: vi.fn() }),
}))

describe('戻るボタンの動作', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockHistoryLength = 2
  })

  const testBookmark = TestBookmarkWithKeywords[0]

  it('履歴が存在する場合（window.history.length > 1）、router.history.back が呼び出されること', async () => {
    mockHistoryLength = 2
    const user = userEvent.setup()

    render(<BookmarkForm bookmark={testBookmark} />)

    await clickButton(user, UI_LABELS.ACTIONS.BACK)

    // 💡 2. router.history.back が呼ばれ、navigate は呼ばれていないことを検証
    expect(mockBack).toHaveBeenCalledTimes(1)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('履歴が存在しない場合、戻るボタンが無効になること', async () => {
    mockHistoryLength = 1

    render(<BookmarkForm bookmark={testBookmark} />)

    const backButton = await screen.findByRole('button', {
      name: UI_LABELS.ACTIONS.BACK,
    })
    expect(backButton).toBeDisabled()
  })
})
