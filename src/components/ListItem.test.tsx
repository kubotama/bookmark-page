import type { ComponentProps, ReactNode } from 'react'

import { render } from '@testing-library/react'
import { describe, it, vi } from 'vitest'

import { TestBookmarks } from '../../functions/test/fixtures'
import { UI_LABELS } from '../../shared/constants/uiMessages'
import { expectText } from '../test/test-utils'
import { ListItem } from './ListItem'

// 💡 any を使わずに型を明示して Link をモック化
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    ...props
  }: ComponentProps<'a'> & {
    children?: ReactNode
    to?: string
  }) => {
    return (
      <a href={to} {...props}>
        {children}
      </a>
    )
  },
}))

describe('ListItem', () => {
  it('テキストが正しく表示されること', async () => {
    render(
      <ListItem
        id={TestBookmarks[0].id}
        to={`/bookmark/${TestBookmarks[0].id}`}
      >
        {TestBookmarks[0].title}
      </ListItem>,
    )

    await expectText({
      link: `/bookmark/${TestBookmarks[0].id}`,
      text: UI_LABELS.ACTIONS.DETAIL,
    })
  })

  it('テキストと「開く」が正しく表示されること', async () => {
    render(
      <ListItem
        id={TestBookmarks[0].id}
        openHref={TestBookmarks[0].url}
        to={`/bookmark/${TestBookmarks[0].id}`}
      >
        {TestBookmarks[0].title}
      </ListItem>,
    )

    await expectText({
      link: `/bookmark/${TestBookmarks[0].id}`,
      text: UI_LABELS.ACTIONS.DETAIL,
    })
    await expectText({
      link: TestBookmarks[0].url,
      text: TestBookmarks[0].title,
    })
  })
})
