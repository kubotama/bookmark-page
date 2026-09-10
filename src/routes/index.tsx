// src/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router'

import { UI_LABELS } from '../../shared/constants/uiMessages'
import { ListItem } from '../components/ListItem'
import { useBookmarks } from '../features/bookmark/useBookmarks'

export const Route = createFileRoute('/')({
  component: IndexComponent,
})

function IndexComponent() {
  const { data: resJson, error, isLoading } = useBookmarks() // 💡 呼ぶだけ

  // 💡 早期リターンを廃止し、データを安全に抽出するためのフォールバック
  const bookmarks = resJson?.data ?? []

  // 💡 常に同じ構造のJSXを最後まで返し、中身だけを三項演算子等で出し分ける
  return (
    <div>
      {isLoading ? (
        /* 1. 読み込み状態の表示 */
        <div className="p-5">{UI_LABELS.ACTIONS.LOADING}</div>
      ) : error ? (
        /* 2. エラー発生時の表示 */
        <div className="p-5 text-red-700">{error.message}</div>
      ) : bookmarks.length === 0 ? (
        /* 3. データが空の時の表示 */
        <p>{UI_LABELS.HEADER.NO_BOOKMARKS}</p>
      ) : (
        /* 4. 通常のデータ一覧表示 */
        <div className="w-full transition">
          <div className="flex flex-col items-start">
            {bookmarks.map((bookmark) => (
              <ListItem
                id={bookmark.id}
                key={bookmark.id}
                openHref={bookmark.url}
                to={`/bookmark/${bookmark.id}`}
              >
                {bookmark.title}
              </ListItem>
            ))}
          </div>
        </div>
      )}
    </div>
  )
  /* v8 ignore start */
}
/* v8 ignore stop */
