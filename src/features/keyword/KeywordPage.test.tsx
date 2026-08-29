import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TestKeywords } from '../../../functions/test/fixtures'
import { UI_LABELS } from '../../../shared/constants/uiMessages'
import { KeywordPage } from './KeywordPage'

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
})
