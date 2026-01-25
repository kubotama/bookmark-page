import './App.css'
import { BookmarkList } from './components/BookmarkList'
import { useBookmarks } from './hooks/useBookmarks'
import { useBookmarkList } from './hooks/useBookmarkList'

function App() {
  const { data, isLoading, error } = useBookmarks()
  const { selectedId, handleRowClick, handleDoubleClick } = useBookmarkList()
  const bookmarks = data?.bookmarks ?? []

  return (
    <div className="min-h-screen max-w-4xl mx-auto">
      <main>
        <BookmarkList
          bookmarks={bookmarks}
          isLoading={isLoading}
          error={error}
          selectedId={selectedId}
          onRowClick={handleRowClick}
          onDoubleClick={handleDoubleClick}
        />
      </main>
    </div>
  )
}

export default App
