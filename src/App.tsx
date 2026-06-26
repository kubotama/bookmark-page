import { useEffect, useState } from "react"
import { z } from "zod"

// Zodで型を定義（バリデーションや安全なパース用）
const BookmarkSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
})
type Bookmark = z.infer<typeof BookmarkSchema>

export default function App() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // HonoのAPIからデータを取得
    fetch("/api/bookmarks")
      .then((res) => res.json())
      .then((resData) => {
        // MVPなので簡易的なパース（本来はZodでsafeParseすると安全）
        if (resData.success) {
          setBookmarks(resData.data)
        }
      })
      .catch((err) => console.error("データ取得失敗:", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: "20px" }}>読み込み中...</div>

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>
        マイブックマーク
      </h1>

      {bookmarks.length === 0 ? (
        <p>ブックマークがありません。</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {bookmarks.map((bookmark) => (
            <li
              key={bookmark.id}
              style={{
                marginBottom: "12px",
                borderBottom: "1px solid #eee",
                paddingBottom: "12px",
              }}
            >
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: "none",
                  color: "#0066cc",
                  fontWeight: "bold",
                  fontSize: "18px",
                }}
              >
                {bookmark.title}
              </a>
              <div
                style={{
                  color: "#666",
                  fontSize: "12px",
                  wordBreak: "break-all",
                  marginTop: "4px",
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
