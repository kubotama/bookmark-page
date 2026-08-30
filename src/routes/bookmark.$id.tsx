import { createFileRoute } from '@tanstack/react-router'

import { UI_LABELS } from '../../shared/constants/uiMessages'
import { BookmarkForm } from '../features/bookmark/BookmarkForm'
import { useBookmarkById } from '../features/bookmark/useBookmarks'

export const Route = createFileRoute('/bookmark/$id')({
  component: BookmarkDetailComponent,
})

function BookmarkDetailComponent() {
  const { id } = Route.useParams()
  const { bookmark, error, isLoading } = useBookmarkById(id)
  // テキストボックス用のローカル状態（State）

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="p-5">{UI_LABELS.ACTIONS.LOADING}</div>
      ) : error ? (
        /* 2. エラー発生時の表示 */
        <div className="p-5 text-red-700">{error.message}</div>
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
