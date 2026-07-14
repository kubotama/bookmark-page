import { useState } from 'react'
import { UI_LABELS } from '../../shared/constants/uiMessages'

interface BookmarkFormProps {
  bookmark: {
    id?: string
    title: string
    url: string
  }
}

export const BookmarkForm = ({ bookmark }: BookmarkFormProps) => {
  const [title, setTitle] = useState(bookmark.title)
  const [url, setUrl] = useState(bookmark.url)

  return (
    <div>
      <div className="w-1/2 m-auto">
        <div className="grid grid-cols-[max-content_1fr] items-center gap-1">
          <label className="text-sm font-medium text-slate-600">
            {UI_LABELS.FIELDS.TITLE}
          </label>
          <input
            type="text"
            aria-label={UI_LABELS.FIELDS.TITLE}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border border-slate-300 text-slate-700 bg-slate-200 rounded px-2 py-1"
          />

          <label className="text-sm font-medium text-slate-600">
            {UI_LABELS.FIELDS.URL}
          </label>
          <input
            type="text"
            aria-label={UI_LABELS.FIELDS.URL}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="border border-slate-300 text-slate-700 bg-slate-200 rounded px-2 py-1"
          />
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2">
          <button className="border border-slate-300 text-slate-700 bg-indigo-200 rounded px-2 py-1 cursor-pointer hover:text-slate-200 hover:bg-indigo-700 hover:font-semibold">
            {UI_LABELS.ACTIONS.OPEN}
          </button>
          <button className="border border-slate-300 text-slate-700 bg-indigo-200 rounded px-2 py-1 cursor-pointer hover:text-slate-200 hover:bg-indigo-700 hover:font-semibold">
            {UI_LABELS.ACTIONS.UPDATE}
          </button>
          <button className="border border-slate-300 text-slate-700 bg-indigo-200 rounded px-2 py-1 cursor-pointer hover:text-slate-200 hover:bg-indigo-700 hover:font-semibold">
            {UI_LABELS.ACTIONS.DELETE}
          </button>
          <button className="border border-slate-300 text-slate-700 bg-indigo-200 rounded px-2 py-1 cursor-pointer hover:text-slate-200 hover:bg-indigo-700 hover:font-semibold">
            {UI_LABELS.ACTIONS.BACK}
          </button>
        </div>
      </div>
    </div>
  )
}
