// src/routes/index.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { UI_LABELS } from '../../shared/constants/uiMessages'
import { useBookmarks } from '../hooks/useBookmarks'

export const Route = createFileRoute('/')({
  component: IndexComponent,
})

function IndexComponent() {
  const { data: resJson, isLoading, error } = useBookmarks() // 💡 呼ぶだけ

  // 💡 早期リターンを廃止し、データを安全に抽出するためのフォールバック
  const bookmarks = resJson?.data ?? []

  // 💡 常に同じ構造のJSXを最後まで返し、中身だけを三項演算子等で出し分ける
  return (
    <div>
      {isLoading ? (
        /* 1. 読み込み状態の表示 */
        <div style={{ padding: '20px' }}>{UI_LABELS.ACTIONS.LOADING}</div>
      ) : error ? (
        /* 2. エラー発生時の表示 */
        <div style={{ padding: '20px', color: 'red' }}>{error.message}</div>
      ) : bookmarks.length === 0 ? (
        /* 3. データが空の時の表示 */
        <p>{UI_LABELS.HEADER.NO_BOOKMARKS}</p>
      ) : (
        /* 4. 通常のデータ一覧表示 */
        <div className="w-1/2 m-auto transition">
          <div className="flex flex-col items-start">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="relative w-full p-2 text-slate-700 bg-slate-200 border border-slate-300 hover:bg-indigo-200 flex justify-between items-center"
              >
                {/* Stretched Link パターンを使用してカード全体をクリック可能にしつつ、キーボード操作も可能にします */}
                <Link
                  to="/bookmark/$id"
                  params={{ id: bookmark.id }}
                  className="hover:font-semibold flex-1 text-left after:absolute after:inset-0"
                >
                  {bookmark.title}
                </Link>
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noreferrer"
                  className="relative z-10 text-shadow-xs text-indigo-400 hover:text-indigo-800 hover:underline hover:font-bold ml-2"
                >
                  {UI_LABELS.ACTIONS.OPEN}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
/* v8 ignore start */
}
/* v8 ignore stop */
