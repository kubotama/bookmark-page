import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { Route as RootRoute } from './__root'

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
  })
})
