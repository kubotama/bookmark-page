import { useQuery } from '@tanstack/react-query'
import { hc } from 'hono/client'
import type { AppType } from '../functions/api/[[route]]'
import { ERROR_MESSAGE, UI_LABELS } from '../shared/constants/uiMessages'
import './index.css'

const client = hc<AppType>('/')

export default function App() {
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
        throw new Error(ERROR_MESSAGE.SERVER_ERROR)
      }

      // 💡 2. ここを通過した時点で、TypeScriptは json の形が
      // { success: true; data: [...] } であることを「確定」させています
      const json = await res.json()

      return json // 👈 これだけでOK！ json.success の個別チェックは不要になります
    },
  })

  // 💡 読み込み状態のハンドリング
  if (isLoading)
    return <div style={{ padding: '20px' }}>{UI_LABELS.ACTIONS.LOADING}</div>

  // 💡 エラー発生時のハンドリング
  if (error) {
    console.error(error.message)
    return <div style={{ padding: '20px', color: 'red' }}>{error.message}</div>
  }
  // 💡 Honoのデータ構造（{ success: true, data: [...] }）に合わせて配列を抽出
  // 初回読み込み前などデータがない場合の安全策として空配列をフォールバック
  const bookmarks = resJson?.data ?? []

  return (
    <div>
      <h1 className="text-slate-200 bg-slate-700 font-bold w-1/2 m-auto text-center text-xl p-3 mb-2 mt-2">
        {UI_LABELS.HEADER.PAGE_HEADER}
      </h1>
      {bookmarks.length === 0 ? (
        <p>{UI_LABELS.HEADER.NO_BOOKMARKS}</p>
      ) : (
        <div className="w-1/2 m-auto bg-slate-50 border border-slate-300 transition cursor-pointer ">
          <div className="flex flex-col items-start">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className={`w-full p-2 
                  text-slate-700 bg-slate-200
                  border border-slate-300
                  hover:bg-indigo-300 has-[a:hover]:bg-indigo-700`}
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
