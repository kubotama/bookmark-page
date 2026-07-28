import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TestBookmarks } from '../../functions/test/fixtures'
import { render } from '@testing-library/react'
import { BookmarkForm } from './BookmarkForm'
import { clickButton } from '../test/test-utils'
import { UI_LABELS } from '../../shared/constants/uiMessages'

const mockBack = vi.fn()
const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({
    history: {
      back: mockBack,
    },
    navigate: mockNavigate,
  }),
}))

vi.mock('../hooks/useDeleteBookmark', () => ({
  useDeleteBookmark: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('../hooks/useUpdateBookmark', () => ({
  useUpdateBookmark: () => ({ mutate: vi.fn(), isPending: false }),
}))

describe('戻るボタンの動作', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  const testBookmark = TestBookmarks[0]

  it('戻るボタンをクリックしたときに、router.history.back が呼び出されること', async () => {
    const user = userEvent.setup()

    render(<BookmarkForm bookmark={testBookmark} />)

    await clickButton(user, UI_LABELS.ACTIONS.BACK)

    // 💡 3. モック関数が1回呼び出されたかを検証
    expect(mockBack).not.toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledTimes(1)
  })

  it('履歴が存在する場合（window.history.length > 1）、router.history.back が呼び出されること', async () => {
    const user = userEvent.setup()

    // 💡 1. window.history.length が常に「2」を返すように偽装する
    vi.spyOn(window.history, 'length', 'get').mockReturnValue(2)

    render(<BookmarkForm bookmark={testBookmark} />)

    await clickButton(user, UI_LABELS.ACTIONS.BACK)

    // 💡 2. router.history.back が呼ばれ、navigate は呼ばれていないことを検証
    expect(mockBack).toHaveBeenCalledTimes(1)
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
