import { createFileRoute } from '@tanstack/react-router'
import { useBookmarkById } from '../hooks/useBookmarks'
import { UI_LABELS } from '../../shared/constants/uiMessages'
import { BookmarkForm } from '../components/BookmarkForm'

export const Route = createFileRoute('/bookmark/$id')({
  component: BookmarkDetailComponent,
})

function BookmarkDetailComponent() {
  const { id } = Route.useParams()
  const { bookmark, isLoading, error } = useBookmarkById(id)
  // テキストボックス用のローカル状態（State）

  return (
    <div>
      {isLoading ? (
        <div style={{ padding: '20px' }}>{UI_LABELS.ACTIONS.LOADING}</div>
      ) : error ? (
        /* 2. エラー発生時の表示 */
        <div style={{ padding: '20px', color: 'red' }}>{error.message}</div>
      ) : bookmark === undefined ? (
        /* 3. データが空の時の表示 */
        <p>{UI_LABELS.HEADER.NO_BOOKMARKS}</p>
      ) : (
        <BookmarkForm key={bookmark.id} bookmark={bookmark} />
      )}
    </div>
  )
  /* v8 ignore start */
}
/* v8 ignore stop */
