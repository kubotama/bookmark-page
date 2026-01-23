import './App.css'
import { BookmarkList } from './components/BookmarkList'
import { useBookmarks } from './hooks/useBookmarks'

function App() {
  const { data, isLoading, error } = useBookmarks()
  const bookmarks = data?.bookmarks ?? []

  return (
    <div className="min-h-screen max-w-4xl mx-auto">
      <main>
        <BookmarkList
          bookmarks={bookmarks}
          isLoading={isLoading}
          error={error}
        />
      </main>
    </div>
  )
}

export default App
