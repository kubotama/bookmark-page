import { createRouter, RouterProvider } from '@tanstack/react-router'
import { act, render } from '@testing-library/react'
import { describe, it } from 'vitest'

import { UI_LABELS } from '../../shared/constants/uiMessages'
import { routeTree } from '../routeTree.gen'
import { expectText } from '../test/test-utils'

async function renderIndexPage() {
  // 本物の routeTree を渡してルーターを初期化
  const router = createRouter({ routeTree })

  await router.load()

  return render(<RouterProvider router={router} />)
}

describe('Index Page', () => {
  it('ブックマークとキーワードの一覧画面へのリンクが表示されていること', async () => {
    await act(async () => {
      await renderIndexPage()
    })

    await expectText({ link: '/bookmark', text: UI_LABELS.NAVIGATION.BOOKMARK })
    await expectText({ link: '/keyword', text: UI_LABELS.NAVIGATION.KEYWORD })
  })
})
