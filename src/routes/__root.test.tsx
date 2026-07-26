import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { Route as RootRoute } from './__root'
import { UI_LABELS } from '../../shared/constants/uiMessages'

window.scrollTo = vi.fn()

describe('Root Layout', () => {
  it('共通レイアウトの中に子ルート（Outlet）が正常にレンダリングされること', async () => {
    // テスト用のダミー子ルートを作成
    const testChildRoute = createRoute({
      getParentRoute: () => RootRoute,
      path: '/',
      component: () => (
        <div data-testid="child-content">子要素のコンテンツ</div>
      ),
    })

    // __root に子ルートを結合
    const routeTree = RootRoute.addChildren([testChildRoute])
    const router = createRouter({ routeTree })

    render(<RouterProvider router={router} />)

    // 全体の背景色などのクラスを持つmainタグ（レイアウト）が存在するか
    const mainElement = await screen.findByRole('main')
    expect(mainElement).toHaveClass('container')

    // Outletを通じて子要素の内容が表示されているか
    expect(screen.getByTestId('child-content')).toBeInTheDocument()

    // ヘッダが表示されているか
    const header = await screen.findByText(UI_LABELS.HEADER.PAGE_HEADER)
    expect(header).toBeInTheDocument()
    expect(header.closest('a')).toHaveAttribute('href', '/')
  })
})
