import './App.css'
import { BookmarkList } from './components/BookmarkList'
import { useBookmarks } from './hooks/useBookmarks'

function App() {
  const { data, isLoading, error } = useBookmarks()
  const bookmarks = data?.bookmarks ?? []

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <main>
          <BookmarkList
            bookmarks={bookmarks}
            isLoading={isLoading}
            error={error}
          />
        </main>
      </div>
    </div>
  )
}

export default App
