import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// 💡 TanStack Router のインポートを追加
import { createRouter, RouterProvider } from '@tanstack/react-router'
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'

import './index.css'
// 💡 自動生成されたルートツリーをインポート（一度ビルド・開発サーバー起動すると生成されます）
import { routeTree } from './routeTree.gen'

// TanStack Query クライアントのインスタンス
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,

      // 💡 追加：取得したデータを5分間は「新鮮（fresh）」とみなす
      // この5分間は、画面を何度行き来しても裏でのAPIアクセス（再フェッチ）が完全に止まります
      staleTime: 5 * 60 * 1000,
    },
  },
})

// 💡 ルーターインスタンスの作成
const router = createRouter({ routeTree })

// 💡 TypeScriptの型定義を登録
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 1. 外側を QueryClientProvider で囲む */}
    <QueryClientProvider client={queryClient}>
      {/* 2. 内側で RouterProvider を呼び出し、Appコンポーネントの代わりに画面を描画する */}
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
)
