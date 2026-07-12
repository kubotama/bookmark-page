// src/routes/index.tsx
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { AppType } from '../../functions/api/[[route]]'
import { hc } from 'hono/client'
import { useQuery } from '@tanstack/react-query'
import { ERROR_MESSAGE, UI_LABELS } from '../../shared/constants/uiMessages'

export const Route = createFileRoute('/')({
  component: IndexComponent,
})

const client = hc<AppType>('/')

function IndexComponent() {
  const {
    data: resJson,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const res = await client.api.bookmarks.$get()
      if (!res.ok) {
        throw new Error(ERROR_MESSAGE.SERVER_ERROR)
      }
      return await res.json()
    },
  })

  // 💡 早期リターンを廃止し、データを安全に抽出するためのフォールバック
  const bookmarks = resJson?.data ?? []
  const router = useRouter()

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
        <div className="w-1/2 m-auto bg-slate-50 border border-slate-300 transition cursor-pointer ">
          <div className="flex flex-col items-start">
            {bookmarks.map((bookmark) => (
              <div
                onClick={() =>
                  router.navigate({
                    to: '/bookmark/$id',
                    params: { id: bookmark.id },
                  })
                }
                key={bookmark.id}
                className="w-full p-2 text-slate-700 bg-slate-200 border border-slate-300 hover:bg-indigo-300 has-[a:hover]:bg-indigo-700"
              >
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-slate-100 hover:font-semibold"
                  onClick={(e) => e.stopPropagation()}
                >
                  {bookmark.title}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
