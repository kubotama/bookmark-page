import { describe, it, expect, vi } from 'vitest'
import { app } from './[[path]]'
import type { D1Database } from '@cloudflare/workers-types'
import { BOOKMARKS } from './constants/sql'

describe('Hono API - POST /api/bookmarks', () => {
  it('正常系: 有効なパラメータを送信したとき、ブックマークが登録され201を返すこと', async () => {
    const firstSpy = vi.fn().mockResolvedValue({
      id: '7488a6de-412d-4076-905e-8848d79cb6ee',
      title: 'Vite 公式サイト',
      url: 'https://vite.dev',
      created_at: '2026-06-28 11:30:00',
    })
    const bindSpy = vi.fn().mockReturnValue({ first: firstSpy })
    const prepareSpy = vi.fn().mockReturnValue({ bind: bindSpy })

    // Partial を使って as any を排除した型安全なモックDB
    const mockD1Database: Partial<D1Database> = {
      prepare: prepareSpy as D1Database['prepare'],
    }

    // 💡 2. テスト対象の POST リクエストデータを用意
    const requestBody = {
      title: 'Vite 公式サイト',
      url: 'https://vite.dev',
    }

    // 💡 3. Hono にリクエストを投げる
    const res = await app.request(
      '/api/bookmarks',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
      {
        BOOKMARK_PAGE_DB: mockD1Database as D1Database, // 適切なバインディング名で注入
      },
    )

    expect(res.status).toBe(201)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.title).toBe('Vite 公式サイト')
    expect(json.data.url).toBe('https://vite.dev')
    expect(json.data.id).toBeDefined()

    expect(prepareSpy).toHaveBeenCalledWith(BOOKMARKS.INSERT)
  })
})
