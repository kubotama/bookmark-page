// src/routes/bookmark.$id.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  createRouter,
  RouterProvider,
  createMemoryHistory,
} from '@tanstack/react-router'
// 💡 自動生成された本物のルートツリーをインポートして重複エラーを解消
import { routeTree } from '../routeTree.gen'

// jsdom環境用に window.scrollTo の警告を黙らせる
window.scrollTo = vi.fn()

describe('Bookmark Detail Page', () => {
  it('URLパラメータからIDを正しく取得して表示できること', async () => {
    // 💡 1. テストしたいIDを含んだURLパスを指定してメモリ履歴（Memory History）を作成
    const memoryHistory = createMemoryHistory({
      initialEntries: ['/bookmark/test-uuid-123'],
    })

    // 💡 2. 本物の routeTree を渡し、history オプションでテスト用のパスを指定する
    const router = createRouter({
      routeTree,
      history: memoryHistory,
    })

    // 💡 3. ルーターの非同期解決（URLとコンポーネントのマッピング）を待つ
    await router.load()

    render(<RouterProvider router={router} />)

    // 画面がレンダリングされ、URLパラメータから取得したIDが表示されているか検証
    const idElement = await screen.findByText(/test-uuid-123/)
    expect(idElement).toBeInTheDocument()

    // 画面内の固定テキストや見出しが正しく表示されているか検証
    expect(
      screen.getByRole('heading', { name: 'ブックマーク詳細' }),
    ).toBeInTheDocument()
  })
})
