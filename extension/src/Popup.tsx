import React, { useEffect, useState } from 'react'

import { BookmarkInput } from '../../shared/components/BookmarkInput'
import { Button } from '../../shared/components/Button'
import { FormInput } from '../../shared/components/FormInput'
import '../extension.css'
import { MessageBarType } from '../../shared/components/MessageBar'
import { UI_LABELS, UI_MESSAGES } from '../../shared/constants/uiMessages'
import { useApiUrl } from './hooks/useApiUrl'
import { client } from './lib/hono'

export function Popup() {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<MessageBarType>(null)
  const { apiUrl, saveApiUrl, setApiUrl, testConnection } = useApiUrl()

  // 💡 ポップアップが開いた瞬間にアクティブタブの情報を取得する
  useEffect(() => {
    if (globalThis.chrome?.tabs) {
      globalThis.chrome.tabs.query(
        { active: true, currentWindow: true },
        (tabs) => {
          const activeTab = tabs?.[0]
          if (activeTab) {
            setTitle(activeTab.title || '')
            setUrl(activeTab.url || '')
          }
        },
      )
    }
  }, [])

  // 💡 フォーム送信（Hono RPC を使った POST リクエスト）
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // RPC クライアントによる型安全な POST 送信
      // $post の引数やレスポンスには、バックエンドの Zod スキーマの型が100%効いています
      const res = await client.api.bookmarks.$post({
        json: { title, url },
      })

      const data = await res.json()

      if (data.success) {
        setMessage({
          text: UI_MESSAGES.BOOKMARKS.ADDED_BOOKMARK,
          type: 'success',
        })
      } else {
        // バックエンド側で整えたバリデーションエラー等のメッセージを表示
        setMessage({
          text: data.error || UI_MESSAGES.API.FAILED_CONNECT_SERVER,
          type: 'error',
        })
      }
    } catch {
      setMessage({ text: UI_MESSAGES.API.FAILED_CONNECT_SERVER, type: 'error' })
    } finally {
      setLoading(false)
    }
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
