import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// 💡 インポートを追加
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// 💡 クライアントのインスタンスを作成
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 必要に応じて自動再取得（ウィンドウフォーカス時など）の挙動を調整できます
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
