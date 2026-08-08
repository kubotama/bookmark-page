import React, { useState } from 'react'

import { BookmarkInput } from '../../shared/components/BookmarkInput'
import { Button } from '../../shared/components/Button'
import { FormInput } from '../../shared/components/FormInput'
import '../extension.css'
import { MessageBarType } from '../../shared/components/MessageBar'
import { UI_LABELS } from '../../shared/constants/uiMessages'
import { useApiUrl } from './hooks/useApiUrl'
import { usePopup } from './hooks/usePopup'

export function Popup() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<MessageBarType>(null)
  const { apiUrl, saveApiUrl, setApiUrl, testConnection } = useApiUrl()
  const { addBookmark, setTitle, setUrl, title, url } = usePopup()

  // 💡 フォーム送信（Hono RPC を使った POST リクエスト）
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const resultMessage = await addBookmark(apiUrl)
    setMessage(resultMessage)
    setLoading(false)
  }

  const handleSaveApiUrl = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setMessage(null)
    const resultMessage = await saveApiUrl()
    setMessage(resultMessage)
  }

  const handleTestConnection = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault()
    setMessage(null)
    const resultMessage = await testConnection()
    setMessage(resultMessage)
  }

  return (
    <div className="p-4">
      <h1 className="text-slate-200 bg-slate-700 font-bold m-auto text-lg text-center p-2 mb-2">
        {UI_LABELS.HEADER.ADD_BOOKMARK}
      </h1>

      <form className="flex flex-col gap-2.5" onSubmit={handleSubmit}>
        <BookmarkInput
          setTitle={setTitle}
          setUrl={setUrl}
          title={title}
          url={url}
        />

        <Button disabled={loading} type="submit">
          {loading
            ? UI_LABELS.ACTIONS.ADDING_BOOKMARK
            : UI_LABELS.ACTIONS.ADD_BOOKMARK}
        </Button>

        <div className="grid grid-cols-[max-content_1fr] items-center gap-1">
          <FormInput
            id="api-url-input"
            label={UI_LABELS.FIELDS.API_URL}
            onChange={(e) => setApiUrl(e.target.value)}
            value={apiUrl}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button disabled={loading} onClick={handleSaveApiUrl} type="button">
            {UI_LABELS.ACTIONS.SAVE_API_URL}
          </Button>
          <Button
            disabled={loading}
            onClick={handleTestConnection}
            type="button"
          >
            {UI_LABELS.ACTIONS.VERIFY_API_URL}
          </Button>
        </div>
      </form>

      {message && (
        <div
          style={{
            backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '4px',
            color: message.type === 'success' ? '#16a34a' : '#dc2626',
            fontSize: '13px',
            marginTop: '12px',
            padding: '8px',
          }}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}
