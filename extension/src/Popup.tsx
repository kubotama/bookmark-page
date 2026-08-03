import { hc } from 'hono/client'
import React, { useEffect, useState } from 'react'

// バックエンド（functions）のエントリーポイントから型定義（AppType）のみをインポート
import type { AppType } from '../../functions/api/[[route]]'

import { TIMEOUT_MILLISECOND } from '../../shared/constants/api'
import {
  ERROR_MESSAGE,
  UI_LABELS,
  UI_MESSAGES,
} from '../../shared/constants/uiMessages'
import { SCHEMA_MESSAGE } from '../../shared/constants/validation'
import { STORAGE_KEY } from '../constants/storage'
import { client } from './lib/hono'
import '../extension.css'

export function Popup() {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [apiUrl, setApiUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<null | {
    text: string
    type: 'error' | 'success'
  }>(null)

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
          text: UI_MESSAGES.BOOKMARKS.SAVED_BOOKMARK,
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

  const validateUrl = (url: string) => {
    try {
      return new URL(url).toString().replace(/\/$/, '')
    } catch {
      setMessage({ text: SCHEMA_MESSAGE.INVALID_URL, type: 'error' })
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
      setMessage({ text: UI_MESSAGES.API.SAVED_API_URL, type: 'success' })
    } catch (error) {
      console.error(error)
      setMessage({ text: UI_MESSAGES.API.FAILED_SAVE_API_URL, type: 'error' })
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
        fetch: (input: RequestInfo | URL, init: RequestInit | undefined) =>
          fetch(input, {
            ...init,
            credentials: 'include',
            signal: controller.signal,
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
        text: UI_MESSAGES.BOOKMARKS.REGISTERED_BOOKMARKS(data.data.length),
        type: 'success',
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
      setMessage({ text: errorMessage, type: 'error' })
    } finally {
      clearTimeout(timeoutId)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-slate-200 bg-slate-700 font-bold m-auto text-lg text-center p-2 mb-2">
        {UI_LABELS.HEADER.ADD_BOOKMARK}
      </h1>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
      >
        <div>
          <label
            htmlFor="title-input"
            style={{
              color: '#4b5563',
              display: 'block',
              fontSize: '12px',
              marginBottom: '4px',
            }}
          >
            {UI_LABELS.FIELDS.TITLE}
          </label>
          <input
            className="border"
            id="title-input"
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ boxSizing: 'border-box', padding: '6px', width: '100%' }}
            type="text"
            value={title}
          />
        </div>

        <div>
          <label
            htmlFor="url-input"
            style={{
              color: '#4b5563',
              display: 'block',
              fontSize: '12px',
              marginBottom: '4px',
            }}
          >
            {UI_LABELS.FIELDS.URL}
          </label>
          <input
            className="border"
            id="url-input"
            onChange={(e) => setUrl(e.target.value)}
            required
            style={{ boxSizing: 'border-box', padding: '6px', width: '100%' }}
            type="url"
            value={url}
          />
        </div>

        <button
          disabled={loading}
          style={{
            backgroundColor: loading ? '#9ca3af' : '#2563eb',
            border: 'none',
            borderRadius: '4px',
            color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '8px',
          }}
          type="submit"
        >
          {loading ? UI_LABELS.ACTIONS.SAVING : UI_LABELS.ACTIONS.SAVE}
        </button>

        <div>
          <label
            htmlFor="api-url-input"
            style={{
              color: '#4b5563',
              display: 'block',
              fontSize: '12px',
              marginBottom: '4px',
            }}
          >
            {UI_LABELS.FIELDS.API_URL}
          </label>
          <input
            className="border"
            id="api-url-input"
            onChange={(e) => setApiUrl(e.target.value)}
            style={{ boxSizing: 'border-box', padding: '6px', width: '100%' }}
            type="url"
            value={apiUrl}
          />
        </div>

        <button
          disabled={loading}
          onClick={handleSaveApiUrl}
          style={{
            backgroundColor: loading ? '#9ca3af' : '#2563eb',
            border: 'none',
            borderRadius: '4px',
            color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '8px',
          }}
          type="button"
        >
          {UI_LABELS.ACTIONS.SAVE_API_URL}
        </button>
        <button
          disabled={loading}
          onClick={handleTestConnection}
          style={{
            backgroundColor: loading ? '#9ca3af' : '#2563eb',
            border: 'none',
            borderRadius: '4px',
            color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '8px',
          }}
          type="button"
        >
          {UI_LABELS.ACTIONS.VERIFY_API_URL}
        </button>
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
