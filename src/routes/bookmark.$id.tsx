import { createFileRoute } from '@tanstack/react-router'

import { UI_LABELS } from '../../shared/constants/uiMessages'
import { BookmarkForm } from '../components/BookmarkForm'
import { useBookmarkById } from '../hooks/useBookmarks'

export const Route = createFileRoute('/bookmark/$id')({
  component: BookmarkDetailComponent,
})

function BookmarkDetailComponent() {
  const { id } = Route.useParams()
  const { bookmark, error, isLoading } = useBookmarkById(id)
  // テキストボックス用のローカル状態（State）

  return (
    <div>
      {isLoading ? (
        <div style={{ padding: '20px' }}>{UI_LABELS.ACTIONS.LOADING}</div>
      ) : error ? (
        /* 2. エラー発生時の表示 */
        <div style={{ color: 'red', padding: '20px' }}>{error.message}</div>
      ) : bookmark === undefined ? (
        /* 3. データが空の時の表示 */
        <p>{UI_LABELS.HEADER.NO_BOOKMARKS}</p>
      ) : (
        <BookmarkForm bookmark={bookmark} key={bookmark.id} />
      )}
    </div>
  )
  /* v8 ignore start */
}
/* v8 ignore stop */
