import './App.css'
import { BookmarkList } from './components/BookmarkList'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
            Bookmark Page
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            お気に入りのリンクを管理・表示します
          </p>
        </header>

        <main>
          <BookmarkList />
        </main>
      </div>
    </div>
  )
}

export default App