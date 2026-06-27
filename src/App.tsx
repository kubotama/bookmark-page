import { useEffect, useState } from 'react'
import { Bookmark } from '@functions/schemas/bookmark'
import { hc } from 'hono/client'
// 💡 バックエンドの型定義を直接相対パスでインポート
import type { AppType } from '@functions/[[path]]'

const client = hc<AppType>('/')

export default function App() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const res = await client.api.bookmarks.$get()

        if (!res.ok) {
          throw new Error('サーバーエラーが発生しました')
        }

        const json = await res.json()

        if (!json.success) {
          throw new Error('データの取得に失敗しました')
        }

        setBookmarks(json.data)
      } catch (err) {
        console.error('データ取得失敗:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBookmarks()
  }, [])
  if (loading) return <div style={{ padding: '20px' }}>読み込み中...</div>

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
