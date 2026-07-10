import React, { useEffect, useState } from 'react'
import { client } from './lib/hono'
import {
  ERROR_MESSAGE,
  UI_LABELS,
  UI_MESSAGES,
} from '../../shared/constants/uiMessages'
import { hc } from 'hono/client'
// バックエンド（functions）のエントリーポイントから型定義（AppType）のみをインポート
import type { AppType } from '../../functions/api/[[route]]'
import { STORAGE_KEY } from '../constants/storage'
import { TIMEOUT_MILLISECOND } from '../../shared/constants/api'
import { SCHEMA_MESSAGE } from '../../shared/constants/validation'
import '../extension.css'

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
        setMessage({
          type: 'success',
          text: UI_MESSAGES.BOOKMARKS.SAVED_BOOKMARK,
        })
      } else {
        // バックエンド側で整えたバリデーションエラー等のメッセージを表示
        setMessage({
          type: 'error',
          text: data.error || UI_MESSAGES.API.FAILED_CONNECT_SERVER,
        })
      }
    } catch {
      setMessage({ type: 'error', text: UI_MESSAGES.API.FAILED_CONNECT_SERVER })
    } finally {
      setLoading(false)
    }
  }

  const validateUrl = (url: string) => {
    try {
      return new URL(url).toString().replace(/\/$/, '')
    } catch {
      setMessage({ type: 'error', text: SCHEMA_MESSAGE.INVALID_URL })
      return undefined
    }
  }

  const handleSaveApiUrl = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setMessage(null)

    const validApiUrl = validateUrl(apiUrl)
    if (!validApiUrl) return

    try {
      if (globalThis.chrome?.storage?.local) {
        await globalThis.chrome.storage.local.set({
          [STORAGE_KEY.API_URL]: validApiUrl,
        })
      }
      setMessage({ type: 'success', text: UI_MESSAGES.API.SAVED_API_URL })
    } catch (error) {
      console.error(error)
      setMessage({ type: 'error', text: UI_MESSAGES.API.FAILED_SAVE_API_URL })
    }
  }

  const handleTestConnection = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault()
    setMessage(null)

    const validApiUrl = validateUrl(apiUrl)
    if (!validApiUrl) return

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MILLISECOND)

    try {
      const testClient = hc<AppType>(validApiUrl, {
        fetch: (input: URL | RequestInfo, init: RequestInit | undefined) =>
          fetch(input, {
            ...init,
            signal: controller.signal,
            credentials: 'include',
          }),
      })

      const response = await testClient.api.bookmarks.$get()

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(ERROR_MESSAGE.AUTH_ERROR)
        }
        throw new Error(ERROR_MESSAGE.STATUS_CODE(response.status))
      }

      const data = await response.json()

      if (!data || !data.success || !Array.isArray(data.data)) {
        throw new SyntaxError('Invalid JSON structure')
      }

      setMessage({
        type: 'success',
        text: UI_MESSAGES.BOOKMARKS.REGISTERED_BOOKMARKS(data.data.length),
      })
    } catch (error) {
      let errorMessage: string = UI_MESSAGES.API.FAILED_CONNECT_SERVER

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = UI_MESSAGES.API.TIMEOUT_CONNECT_SERVER
        } else if (error instanceof SyntaxError) {
          errorMessage = UI_MESSAGES.AUTH.INVALID_RESPONSE
        } else if (error.message === ERROR_MESSAGE.AUTH_ERROR) {
          errorMessage = UI_MESSAGES.AUTH.ZERO_TRUST_AUTH_ERROR
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
      <h1 className="text-gray-500 text-xl">{UI_LABELS.HEADER.ADD_BOOKMARK}</h1>

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
            {UI_LABELS.FIELDS.TITLE}
          </label>
          <input
            id="title-input"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border"
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
            {UI_LABELS.FIELDS.URL}
          </label>
          <input
            id="url-input"
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="border"
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
          {loading ? UI_LABELS.ACTIONS.SAVING : UI_LABELS.ACTIONS.SAVE}
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
            {UI_LABELS.FIELDS.API_URL}
          </label>
          <input
            id="api-url-input"
            type="url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="border"
            style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
          />
        </div>

        <button
          onClick={handleSaveApiUrl}
          type="button"
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
          {UI_LABELS.ACTIONS.SAVE_API_URL}
        </button>
        <button
          onClick={handleTestConnection}
          type="button"
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
          {UI_LABELS.ACTIONS.VERIFY_API_URL}
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
