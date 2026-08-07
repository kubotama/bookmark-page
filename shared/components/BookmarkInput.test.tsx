import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BookmarkInput } from './BookmarkInput'
import { TestBookmarks } from '../../functions/test/fixtures'
import { inputText } from '../../src/test/test-utils'
import { UI_LABELS } from '../constants/uiMessages'
import { screen } from '@testing-library/react'

describe('BookmarkInput', () => {
  it('タイトルとurlの変更が反映されること', async () => {
    const user = userEvent.setup()
    const mockSetTitle = vi.fn()
    const mockSetUrl = vi.fn()

    render(
      <BookmarkInput
        title={TestBookmarks[0].title}
        url={TestBookmarks[0].url}
        setTitle={mockSetTitle}
        setUrl={mockSetUrl}
      />,
    )
    await inputText(user, UI_LABELS.FIELDS.TITLE, TestBookmarks[1].title)
    await inputText(user, UI_LABELS.FIELDS.URL, TestBookmarks[1].url)

    expect(
      screen.getByRole('textbox', { name: UI_LABELS.FIELDS.TITLE }),
      TestBookmarks[1].title,
    )
    expect(mockSetTitle).toHaveBeenCalledTimes(
      TestBookmarks[1].title.length + 1,
    )
    expect(
      screen.getByRole('textbox', { name: UI_LABELS.FIELDS.URL }),
      TestBookmarks[1].url,
    )
    expect(mockSetUrl).toHaveBeenCalledTimes(TestBookmarks[1].url.length + 1)
  })
})
