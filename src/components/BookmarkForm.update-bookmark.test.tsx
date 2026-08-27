import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  INVALID_STRING,
  TestBookmarks,
  TestBookmarkWithKeywords,
} from '../../functions/test/fixtures'
import { UI_LABELS } from '../../shared/constants/uiMessages'
import { inputText } from '../test/test-utils'
import { BookmarkForm } from './BookmarkForm'

vi.mock('@tanstack/react-router', () => ({
  Link: vi.fn(),
  useRouter: () => ({ history: { back: vi.fn() }, navigate: vi.fn() }),
}))

vi.mock('../hooks/useDeleteBookmark', () => ({
  useDeleteBookmark: () => ({ isPending: false, mutate: vi.fn() }),
}))

const mockUpdate = vi.fn()
const mockIsUpdatePending = false

vi.mock('../hooks/useUpdateBookmark', () => ({
  useUpdateBookmark: () => ({
    isPending: mockIsUpdatePending,
    mutate: mockUpdate,
  }),
}))

vi.mock('../hooks/useKeywords', () => ({
  useKeywords: () => ({ data: { data: [] } }),
}))

vi.mock('../hooks/useAddKeyword', () => ({
  useAddKeyword: () => ({ isPending: false, mutate: vi.fn() }),
}))

describe('更新ボタンの動作', () => {
  const testBookmark = TestBookmarkWithKeywords[0]

  const testData: { name: string; title?: string; url?: string }[] = [
    { name: 'タイトルもurlも変更しなければ' },
    { name: 'タイトルが不正ならば', title: '' },
    { name: 'urlが不正ならば', url: INVALID_STRING.URL },
    { name: 'urlがftpならば', url: INVALID_STRING.FTP },
  ]

  it.each(testData)(
    `$name更新ボタンが無効であること`,
    async ({ title, url }) => {
      const user = userEvent.setup()

      render(<BookmarkForm bookmark={testBookmark} />)

      await inputText(user, UI_LABELS.FIELDS.TITLE, title)
      await inputText(user, UI_LABELS.FIELDS.URL, url)

      const updateButton = await screen.findByRole('button', {
        name: UI_LABELS.ACTIONS.UPDATE,
      })
      expect(updateButton).toBeDisabled()
    },
  )

  it('タイトルを正しく変更したら更新ボタンが有効になること', async () => {
    const user = userEvent.setup()

    render(<BookmarkForm bookmark={testBookmark} />)

    await inputText(user, UI_LABELS.FIELDS.TITLE, TestBookmarks[1].title)

    const updateButton = await screen.findByRole('button', {
      name: UI_LABELS.ACTIONS.UPDATE,
    })
    expect(updateButton).toBeEnabled()
  })

  it('更新ボタンをクリックしたらupdateBookmark()が呼び出されること', async () => {
    const user = userEvent.setup()
    render(<BookmarkForm bookmark={testBookmark} />)

    await inputText(user, UI_LABELS.FIELDS.TITLE, TestBookmarks[1].title)

    const updateButton = await screen.findByRole('button', {
      name: UI_LABELS.ACTIONS.UPDATE,
    })
    await user.click(updateButton)

    // 検証: フックの削除関数が、正しいIDを引数にして呼ばれたか
    expect(mockUpdate).toHaveBeenCalledWith({
      id: testBookmark.id,
      title: TestBookmarks[1].title,
      url: testBookmark.url,
    })
  })
})
