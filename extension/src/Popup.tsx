import React, { useEffect, useState } from 'react'
import { client } from './lib/hono'
import {
  DEFAULT_TEXT,
  DISPLAY_TEXT,
  ERROR_MESSAGE,
} from '../../functions/constants/string'
import { hc } from 'hono/client'
// バックエンド（functions）のエントリーポイントから型定義（AppType）のみをインポート
import type { AppType } from '../../functions/api/[[route]]'

export function Popup() {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [apiUrl, setApiUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

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
    } else {
      // ローカルブラウザでの通常開発（プレビュー）用のフォールバック
      setTitle(DEFAULT_TEXT.TITLE)
      setUrl(DEFAULT_TEXT.URL)
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
        setMessage({ type: 'success', text: DISPLAY_TEXT.SAVED_BOOKMARK })
      } else {
        // バックエンド側で整えたバリデーションエラー等のメッセージを表示
        setMessage({
          type: 'error',
          text: data.error || DISPLAY_TEXT.FAILED_CONNECT_SERVER,
        })
      }
    } catch {
      setMessage({ type: 'error', text: DISPLAY_TEXT.FAILED_CONNECT_SERVER })
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault()
    setMessage(null)

    try {
      const validApiUrl = new URL(apiUrl)

      // 1. 入力されたURLを使って、その場限りの検証用クライアントを生成
      // タイムアウト設定（5秒）を第2引数の fetch オプションに滑り込ませる
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const testClient = hc<AppType>(validApiUrl.origin, {
        fetch: (input: URL | RequestInfo, init: RequestInit | undefined) =>
          fetch(input, { ...init, signal: controller.signal }),
      })

      // 2. 実際に RPC で GET /api/bookmarks を叩く
      const response = await testClient.api.bookmarks.$get()
      clearTimeout(timeoutId)

      // 3. 応答コードのチェック
      if (!response.ok) {
        throw new Error(ERROR_MESSAGE.STATUS_CODE(response.status))
      }

      // 4. JSONの解析（Zero Trustに阻まれてログインHTMLが返ってきた場合はここでパースエラーになる）
      const data = await response.json()

      setMessage({
        type: 'success',
        text: DISPLAY_TEXT.REGISTERED_BOOKMARKS(data.data.length),
      })
    } catch (error) {
      let errorMessage: string = DISPLAY_TEXT.FAILED_CONNECT_SERVER

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = DISPLAY_TEXT.TIMEOUT_CONNECT_SERVER
        } else if (error.name === 'TypeError') {
          errorMessage = DISPLAY_TEXT.INVALID_URL_FORMAT
        } else if (error instanceof SyntaxError) {
          // JSONのパースエラーが起きた＝HTML（Zero Trustのログイン画面）が返ってきた可能性大
          errorMessage = DISPLAY_TEXT.INVALID_RESPONSE
        } else if (error.message) {
          console.error(error.message)
        }
      }
      setMessage({ type: 'error', text: errorMessage })
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
            htmlFor="title-input"
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
            id="title-input"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label
            htmlFor="url-input"
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
            id="url-input"
            type="url"
            required
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

        <div>
          <label
            htmlFor="api-url-input"
            style={{
              display: 'block',
              fontSize: '12px',
              color: '#4b5563',
              marginBottom: '4px',
            }}
          >
            {DISPLAY_TEXT.API_URL}
          </label>
          <input
            id="api-url-input"
            type="url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
          />
        </div>

        <button
          style={{
            padding: '8px',
            backgroundColor: loading ? '#9ca3af' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {DISPLAY_TEXT.SAVE_API_URL}
        </button>
        <button
          onClick={handleTestConnection}
          style={{
            padding: '8px',
            backgroundColor: loading ? '#9ca3af' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {DISPLAY_TEXT.VERIFY_API_URL}
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
