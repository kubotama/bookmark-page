import { createFileRoute } from '@tanstack/react-router'

import { UI_LABELS } from '../../shared/constants/uiMessages'
import { KeywordPage } from '../features/keyword/KeywordPage'
import { useKeywordById } from '../hooks/useKeywords'

export const Route = createFileRoute('/keyword/$id')({
  component: KeywordDetailComponent,
})

function KeywordDetailComponent() {
  const { id } = Route.useParams()
  const { error, isLoading, keyword } = useKeywordById(id)

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="p-5">{UI_LABELS.ACTIONS.LOADING}</div>
      ) : error ? (
        /* 2. エラー発生時の表示 */
        <div className="p-5 text-red-700">{error.message}</div>
      ) : keyword === undefined ? (
        /* 3. データが空の時の表示 */
        <p>{UI_LABELS.HEADER.NO_KEYWORDS}</p>
      ) : (
        <KeywordPage key={keyword.id} keyword={keyword} />
      )}
    </div>
  )
  /* v8 ignore start */
}
/* v8 ignore stop */
