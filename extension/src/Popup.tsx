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
import { STORAGE_KEY } from './constants/storage'
import { TIMEOUT_MILLISECOND } from '../../functions/constants/api'

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

    if (globalThis.chrome?.storage?.local) {
      globalThis.chrome.storage.local
        .get([STORAGE_KEY.API_URL])
        .then((result) => {
          if (result[STORAGE_KEY.API_URL]) {
            setApiUrl(result[STORAGE_KEY.API_URL])
          }
        })
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

  const validateApiUrl = (apiUrl: string) => {
    return new URL(apiUrl).toString().replace(/\/$/, '')
  }

  const handleSaveApiUrl = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    setMessage(null)

    try {
      const validApiUrl = new URL(apiUrl)
      if (globalThis.chrome?.storage?.local) {
        await globalThis.chrome.storage.local.set({
          [STORAGE_KEY.API_URL]: validApiUrl.origin,
        })
      }

      setMessage({ type: 'success', text: DISPLAY_TEXT.SAVED_API_URL })
    } catch (error) {
      let errorMessage: string = DISPLAY_TEXT.FAILED_SAVE_API_URL

      if (error instanceof Error) {
        if (error.name === 'TypeError') {
          errorMessage = DISPLAY_TEXT.INVALID_URL_FORMAT
        } else if (error.message) {
          console.error(error.message)
        }
      }
      setMessage({ type: 'error', text: errorMessage })
    }
  }

  const handleTestConnection = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault()
    setMessage(null)

    let validApiUrl: string
    try {
      validApiUrl = validateApiUrl(apiUrl)
    } catch {
      setMessage({ type: 'error', text: DISPLAY_TEXT.INVALID_URL_FORMAT })
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MILLISECOND)

    try {
      const testClient = hc<AppType>(validApiUrl, {
        fetch: (input: URL | RequestInfo, init: RequestInit | undefined) =>
          fetch(input, { ...init, signal: controller.signal }),
      })

      const response = await testClient.api.bookmarks.$get()

      if (!response.ok) {
        throw new Error(ERROR_MESSAGE.STATUS_CODE(response.status))
      }

      const data = await response.json()

      if (!data || !data.success || !Array.isArray(data.data)) {
        throw new SyntaxError('Invalid JSON structure')
      }

      setMessage({
        type: 'success',
        text: DISPLAY_TEXT.REGISTERED_BOOKMARKS(data.data.length),
      })
    } catch (error) {
      let errorMessage: string = DISPLAY_TEXT.FAILED_CONNECT_SERVER

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = DISPLAY_TEXT.TIMEOUT_CONNECT_SERVER
        } else if (error instanceof SyntaxError) {
          errorMessage = DISPLAY_TEXT.INVALID_RESPONSE
        } else {
          console.error(error.message)
        }
      }
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      clearTimeout(timeoutId)
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
          onClick={handleSaveApiUrl}
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
