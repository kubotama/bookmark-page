import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import {
  Bookmark,
  BookmarkUrlSchema,
  UpdateBookmarkSchema,
} from '../../functions/schemas/bookmark'
import { UI_LABELS, UI_MESSAGES } from '../../shared/constants/uiMessages'
import { useDeleteBookmark } from '../hooks/useDeleteBookmark'
import { useUpdateBookmark } from '../hooks/useUpdateBookmark'

interface BookmarkFormProps {
  bookmark: Bookmark
}

export const BookmarkForm = ({ bookmark }: BookmarkFormProps) => {
  const [title, setTitle] = useState(bookmark.title)
  const [url, setUrl] = useState(bookmark.url)
  const router = useRouter()
  const { isPending, mutate: deleteBookmark } = useDeleteBookmark()
  const { isPending: isUpdatePending, mutate: updateBookmark } =
    useUpdateBookmark()

  const isSubmitDisable = !BookmarkUrlSchema.safeParse(url).success
  const isDirty = bookmark.title !== title.trim() || bookmark.url !== url.trim()
  const canUpdate =
    isDirty && UpdateBookmarkSchema.safeParse({ title, url }).success
  const isUpdateDisable = !canUpdate || isUpdatePending
  const isBackDisable = router.history.length < 2

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    window.open(url, '_blank', 'noreferrer')
  }

  const handleBack = () => {
    router.history.back()
  }

  const handleDelete = () => {
    // ユーザーへの最終確認（誤操作防止）
    const isConfirmed = window.confirm(
      UI_MESSAGES.BOOKMARKS.CONFIRM_DELETE(bookmark.title),
    )

    if (isConfirmed) {
      // バリデーション済みのIDを渡してAPI実行をトリガー
      deleteBookmark(bookmark.id)
    }
  }

  const handleUpdate = () => {
    updateBookmark({
      id: bookmark.id,
      title,
      url,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="w-1/2 m-auto">
        <div className="grid grid-cols-[max-content_1fr] items-center gap-1">
          <label className="text-sm font-medium text-slate-600">
            {UI_LABELS.FIELDS.TITLE}
          </label>
          <input
            aria-label={UI_LABELS.FIELDS.TITLE}
            className="border border-slate-300 text-slate-700 bg-slate-200 rounded px-2 py-1"
            onChange={(e) => setTitle(e.target.value)}
            type="text"
            value={title}
          />

          <label className="text-sm font-medium text-slate-600">
            {UI_LABELS.FIELDS.URL}
          </label>
          <input
            aria-label={UI_LABELS.FIELDS.URL}
            className="border border-slate-300 text-slate-700 bg-slate-200 rounded px-2 py-1"
            onChange={(e) => setUrl(e.target.value)}
            type="text"
            value={url}
          />
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2">
          <button
            className={`border border-slate-300 text-slate-700 bg-indigo-200 rounded px-2 py-1 cursor-pointer
            hover:text-slate-200 hover:bg-indigo-700 hover:font-semibold
            disabled:bg-slate-200 disabled:text-slate-500`}
            disabled={isSubmitDisable}
            type="submit"
          >
            {UI_LABELS.ACTIONS.OPEN}
          </button>
          <button
            className={`border border-slate-300 text-slate-700 bg-indigo-200 rounded px-2 py-1 cursor-pointer
            hover:text-slate-200 hover:bg-indigo-700 hover:font-semibold
            disabled:bg-slate-200 disabled:text-slate-500`}
            disabled={isUpdateDisable}
            onClick={handleUpdate}
            type="button"
          >
            {UI_LABELS.ACTIONS.UPDATE}
          </button>
          <button
            className="border border-slate-300 text-slate-700 bg-indigo-200 rounded px-2 py-1 cursor-pointer hover:text-slate-200 hover:bg-indigo-700 hover:font-semibold"
            disabled={isPending} // 削除中は連打できないように無効化
            onClick={handleDelete}
            type="button"
          >
            {UI_LABELS.ACTIONS.DELETE}
          </button>
          <button
            className={`border border-slate-300 text-slate-700 bg-indigo-200 rounded px-2 py-1 cursor-pointer
            hover:text-slate-200 hover:bg-indigo-700 hover:font-semibold
            disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed`}
            disabled={isBackDisable}
            onClick={handleBack}
            type="button"
          >
            {UI_LABELS.ACTIONS.BACK}
          </button>
        </div>
      </div>
    </form>
  )
}
