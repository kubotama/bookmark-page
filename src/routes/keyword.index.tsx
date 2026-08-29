import { createFileRoute } from '@tanstack/react-router'

import { UI_LABELS } from '../../shared/constants/uiMessages'
import { ListItem } from '../components/ListItem'
import { useKeywords } from '../hooks/useKeywords'

export const Route = createFileRoute('/keyword/')({
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
              <ListItem
                id={keyword.id}
                key={keyword.id}
                to={`/keyword/${keyword.id}`}
              >
                {keyword.name}
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
