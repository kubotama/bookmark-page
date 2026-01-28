import React, { useEffect, useState } from 'react'

import { UI_MESSAGES } from '@shared/constants'

import type { Bookmark } from '@shared/schemas/bookmark'

interface BookmarkDetailProps {
  bookmark: Bookmark
  onUpdate: (title: string, url: string) => void
  onDelete: () => void
  onClose: () => void
}

export const BookmarkDetail: React.FC<BookmarkDetailProps> = ({
  bookmark,
  onUpdate,
  onDelete,
  onClose,
}) => {
  const [editTitle, setEditTitle] = useState(bookmark.title)
  const [editUrl, setEditUrl] = useState(bookmark.url)

  // 選択されたブックマークが変わった時に、入力内容をリセット
  useEffect(() => {
    setEditTitle(bookmark.title)
    setEditUrl(bookmark.url)
  }, [bookmark])

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(editTitle, editUrl)
  }

  const handleDelete = () => {
    if (window.confirm(UI_MESSAGES.DELETE_CONFIRM)) {
      onDelete()
    }
  }

  const handleOpen = () => {
    window.open(bookmark.url, '_blank', 'noreferrer')
  }

  return (
    <div className="bg-white border-t border-gray-200 p-4 shadow-lg fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-end gap-4">
        <div className="flex-1 w-full space-y-2">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
            Title
          </label>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Bookmark Title"
          />
        </div>
        <div className="flex-2 w-full space-y-2">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
            URL
          </label>
          <input
            type="text"
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
            placeholder="https://..."
          />
        </div>
        <div className="flex flex-row gap-2 w-full md:w-auto mt-2 md:mt-0">
          <button
            onClick={handleUpdate}
            className="flex-1 md:flex-none px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            {UI_MESSAGES.BUTTON_UPDATE}
          </button>
          <button
            onClick={handleOpen}
            className="flex-1 md:flex-none px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors shadow-sm"
          >
            {UI_MESSAGES.BUTTON_OPEN}
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm font-medium hover:bg-red-100 transition-colors"
          >
            {UI_MESSAGES.BUTTON_DELETE}
          </button>
          <button
            onClick={onClose}
            className="hidden md:block px-2 py-2 text-gray-400 hover:text-gray-600 transition-colors"
            title={UI_MESSAGES.BUTTON_CLOSE}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
