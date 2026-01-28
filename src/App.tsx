import './App.css'
import { BookmarkList } from './components/BookmarkList'
import { BookmarkDetail } from './components/BookmarkDetail'
import {
  useBookmarks,
  useUpdateBookmark,
  useDeleteBookmark,
} from './hooks/useBookmarks'
import { useBookmarkList } from './hooks/useBookmarkList'

function App() {
  const { data, isLoading, error } = useBookmarks()
  const { selectedId, handleRowClick, handleDoubleClick, setSelectedId } =
    useBookmarkList()
  const updateMutation = useUpdateBookmark()
  const deleteMutation = useDeleteBookmark()

  const bookmarks = data?.bookmarks ?? []
  const selectedBookmark = bookmarks.find((b) => b.id === selectedId)

  const handleUpdate = (title: string, url: string) => {
    if (selectedId) {
      updateMutation.mutate({ id: selectedId, updates: { title, url } })
    }
  }

  const handleDelete = () => {
    if (selectedId) {
      deleteMutation.mutate(selectedId, {
        onSuccess: () => setSelectedId(null),
      })
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        <BookmarkList
          bookmarks={bookmarks}
          isLoading={isLoading}
          error={error}
          selectedId={selectedId}
          onRowClick={handleRowClick}
          onDoubleClick={handleDoubleClick}
        />
      </main>

      {selectedBookmark && (
        <footer className="shrink-0 h-auto">
          <BookmarkDetail
            bookmark={selectedBookmark}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onClose={() => setSelectedId(null)}
          />
        </footer>
      )}
    </div>
  )
}

export default App
