import React, { useEffect, useState } from 'react'
import { client } from './lib/hono'
import { DEFAULT_TEXT, DISPLAY_TEXT } from '../../functions/constants/string'

export function Popup() {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // 💡 ポップアップが開いた瞬間にアクティブタブの情報を取得する
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0]
        if (activeTab) {
          setTitle(activeTab.title || '')
          setUrl(activeTab.url || '')
        }
      })
    } else {
      // ローカルブラウザでの通常開発（プレビュー）用のフォールバック
      setTitle(DEFAULT_TEXT.TITLE)
      setUrl(DEFAULT_TEXT.URL)
    }
  }, [])

  // 💡 フォーム送信（Hono RPC を使った POST リクエスト）
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
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
        setMessage({ type: 'success', text: DISPLAY_TEXT.SAVED_BOOKMARK })
      } else {
        // バックエンド側で整えたバリデーションエラー等のメッセージを表示
        setMessage({ type: 'error', text: data.error })
      }
    } catch (err) {
      setMessage({ type: 'error', text: DISPLAY_TEXT.FALED_CONNECT_SERVER })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ fontSize: '16px', margin: '0 0 12px 0', color: '#111827' }}>
        Add Bookmark
      </h1>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              color: '#4b5563',
              marginBottom: '4px',
            }}
          >
            {DISPLAY_TEXT.TITLE}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              color: '#4b5563',
              marginBottom: '4px',
            }}
          >
            {DISPLAY_TEXT.URL}
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '8px',
            backgroundColor: loading ? '#9ca3af' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? DISPLAY_TEXT.SAVING : DISPLAY_TEXT.SAVE}
        </button>
      </form>

      {message && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '13px',
            backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: message.type === 'success' ? '#16a34a' : '#dc2626',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          }}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}
