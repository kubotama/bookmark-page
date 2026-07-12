import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/bookmark/$id')({
  component: BookmarkDetailComponent,
})

function BookmarkDetailComponent() {
  const { id } = Route.useParams()

  return (
    <div className="space-y-4 bg-white p-6 rounded-xl border border-slate-200">
      <h1 className="text-xl font-bold">ブックマーク詳細</h1>
      <p className="text-sm text-slate-500">ID: {id}</p>

      {/* 一覧へ戻るボタン */}
      <Link
        to="/"
        className="inline-block text-sm text-indigo-600 hover:underline"
      >
        ← 一覧に戻る
      </Link>
    </div>
  )
}
