import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { TestBookmarks } from '../../functions/test/fixtures'
import { UI_LABELS } from '../../shared/constants/uiMessages'
import { inputText } from '../../src/test/test-utils'
import { Popup } from './Popup'

type TestDataType = {
  description: string
  expectedValue: string
  inputLabel: string
  inputValue: string
}

describe('Popupのリンクテキストのテスト', () => {
  const testData: TestDataType[] = [
    {
      description: 'タイトル',
      expectedValue: `[${TestBookmarks[1].title}](${TestBookmarks[0].url})`,
      inputLabel: UI_LABELS.FIELDS.TITLE,
      inputValue: TestBookmarks[1].title,
    },
    {
      description: 'url',
      expectedValue: `[${TestBookmarks[0].title}](${TestBookmarks[1].url})`,
      inputLabel: UI_LABELS.FIELDS.URL,
      inputValue: TestBookmarks[1].url,
    },
  ]

  it.each(testData)(
    `$description が変更されるとリンクテキストが変更されること`,
    async ({ expectedValue, inputLabel, inputValue }) => {
      render(<Popup />)

      expect(
        screen.getByRole('textbox', {
          name: UI_LABELS.FIELDS.LINK_TEXT,
        }),
      ).toHaveValue(`[${TestBookmarks[0].title}](${TestBookmarks[0].url})`)

      const user = userEvent.setup()
      await inputText(user, inputLabel, inputValue)

      await waitFor(() => {
        expect(
          screen.getByRole('textbox', {
            name: UI_LABELS.FIELDS.LINK_TEXT,
          }),
        ).toHaveValue(expectedValue)
      })
    },
  )
})
