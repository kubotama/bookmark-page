import { createFileRoute, Link } from '@tanstack/react-router'

import { UI_LABELS } from '../../shared/constants/uiMessages'
import { useKeywords } from '../hooks/useKeywords'

export const Route = createFileRoute('/keyword')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: resJson, error, isLoading } = useKeywords() // 💡 呼ぶだけ

  const keywords = resJson?.data ?? []

  return (
    <div>
      {isLoading ? (
        /* 1. 読み込み状態の表示 */
        <div className="p-5">{UI_LABELS.ACTIONS.LOADING}</div>
      ) : error ? (
        /* 2. エラー発生時の表示 */
        <div className="p-5 text-red-700">{error.message}</div>
      ) : keywords.length === 0 ? (
        /* 3. データが空の時の表示 */
        <p>{UI_LABELS.HEADER.NO_KEYWORDS}</p>
      ) : (
        /* 4. 通常のデータ一覧表示 */
        <div className="w-full transition">
          <div className="flex flex-col items-start">
            {keywords.map((keyword) => (
              <div
                className="relative w-full p-2 text-slate-700 bg-slate-200 border border-slate-300 hover:bg-indigo-200 flex justify-between items-center"
                key={keyword.id}
              >
                {/* Stretched Link パターンを使用してカード全体をクリック可能にしつつ、キーボード操作も可能にします */}
                <Link
                  className="hover:font-semibold flex-1 text-left after:absolute after:inset-0"
                  params={{ id: keyword.id }}
                  to="/bookmark/$id"
                >
                  {keyword.name}
                </Link>
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
