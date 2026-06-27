import { useQuery } from '@tanstack/react-query'
import { hc } from 'hono/client'
import type { AppType } from '@functions/[[path]]'

const client = hc<AppType>('/')

export default function App() {
  // 💡 useQuery を使ってフェッチ、ローディング、エラーを一元管理！
  const {
    data: resJson,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const res = await client.api.bookmarks.$get()

      // 💡 1. サーバーエラー（400系、500系など）が起きた場合
      if (!res.ok) {
        throw new Error('サーバーエラーが発生しました')
      }

      // 💡 2. ここを通過した時点で、TypeScriptは json の形が
      // { success: true; data: [...] } であることを「確定」させています
      const json = await res.json()

      return json // 👈 これだけでOK！ json.success の個別チェックは不要になります
    },
  })

  // 💡 読み込み状態のハンドリング
  if (isLoading) return <div style={{ padding: '20px' }}>読み込み中...</div>

  // 💡 エラー発生時のハンドリング
  if (error) {
    console.error(error.message)
    return <div style={{ padding: '20px', color: 'red' }}>{error.message}</div>
  }
  // 💡 Honoのデータ構造（{ success: true, data: [...] }）に合わせて配列を抽出
  // 初回読み込み前などデータがない場合の安全策として空配列をフォールバック
  const bookmarks = resJson?.data ?? []

  return (
    <div
      style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'sans-serif',
      }}
    >
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
        マイブックマーク
      </h1>

      {bookmarks.length === 0 ? (
        <p>ブックマークがありません。</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {bookmarks.map((bookmark) => (
            <li
              key={bookmark.id}
              style={{
                marginBottom: '12px',
                borderBottom: '1px solid #eee',
                paddingBottom: '12px',
              }}
            >
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: 'none',
                  color: '#0066cc',
                  fontWeight: 'bold',
                  fontSize: '18px',
                }}
              >
                {bookmark.title}
              </a>
              <div
                style={{
                  color: '#666',
                  fontSize: '12px',
                  wordBreak: 'break-all',
                  marginTop: '4px',
                }}
              >
                {bookmark.url}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
