import { describe, it, expect, beforeEach } from 'vitest'
import app from '../app'
import { db, resetDatabase } from '../db'

describe('GET /api/bookmarks', () => {
  beforeEach(() => {
    resetDatabase()
  })

  it('適切なレスポンス構造でブックマーク一覧を返すこと', async () => {
    // シードデータの投入
    db.prepare('INSERT INTO bookmarks (title, url) VALUES (?, ?)').run(
      'Example Domain',
      'https://example.com',
    )
    db.prepare('INSERT INTO bookmarks (title, url) VALUES (?, ?)').run(
      'Google',
      'https://google.com',
    )

    const res = await app.request('/api/bookmarks')
    expect(res.status).toBe(200)

    const body = await res.json()

    // レスポンスが bookmarks キーを持つオブジェクトであることを確認
    expect(body).toHaveProperty('bookmarks')
    expect(Array.isArray(body.bookmarks)).toBe(true)
    expect(body.bookmarks).toHaveLength(2)

    // 各ブックマークが期待されるプロパティを持っていることを確認
    const bookmark = body.bookmarks[0]
    expect(bookmark).toHaveProperty('id')
    expect(bookmark.title).toBe('Example Domain')
    expect(bookmark.url).toBe('https://example.com')
    // createdAt は除外されたことを確認
    expect(bookmark).not.toHaveProperty('createdAt')
  })

  it('データが空の場合、空の配列を返すこと', async () => {
    const res = await app.request('/api/bookmarks')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.bookmarks).toEqual([])
  })
})
