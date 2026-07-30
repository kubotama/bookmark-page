import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TestBookmarks } from '../../functions/test/fixtures'
import { UI_LABELS } from '../../shared/constants/uiMessages'
import { BookmarkForm } from './BookmarkForm'

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ history: { back: vi.fn() }, navigate: vi.fn() }),
}))

vi.mock('../hooks/useDeleteBookmark', () => ({
  useDeleteBookmark: () => ({ isPending: false, mutate: vi.fn() }),
}))

vi.mock('../hooks/useUpdateBookmark', () => ({
  useUpdateBookmark: () => ({ isPending: false, mutate: vi.fn() }),
}))

describe('BookmarkForm', () => {
  it('該当するブックマークのurlとタイトルが正しく表示されること', async () => {
    const targetBookmark = TestBookmarks[0]
    render(<BookmarkForm bookmark={targetBookmark} key={targetBookmark.id} />)

    const titleElement = await screen.findByRole('textbox', {
      name: UI_LABELS.FIELDS.TITLE,
    })
    expect(titleElement).toHaveValue(targetBookmark.title)
    const urlElement = await screen.findByRole('textbox', {
      name: UI_LABELS.FIELDS.URL,
    })
    expect(urlElement).toHaveValue(targetBookmark.url)
  })
})
