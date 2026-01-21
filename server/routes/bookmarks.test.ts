import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import app from '../app'
import { db, initializeDatabase, resetDatabase } from '../db'
import { ERROR_MESSAGES } from '@shared/constants'

describe('GET /api/bookmarks', () => {
  beforeEach(() => {
    initializeDatabase()
    resetDatabase()
  })

  afterEach(() => {
    vi.restoreAllMocks()
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

  it('データベースエラー時に 500 ステータスと安全なメッセージを返すこと', async () => {
    // db.prepare が呼ばれた時にエラーを投げるようにモックする
    const dbSpy = vi.spyOn(db, 'prepare').mockImplementation(() => {
      throw new Error('Database connection failed')
    })

    // console.error をスパイして出力を抑制する
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      const res = await app.request('/api/bookmarks')

      // 1. ステータスコードが 500 であること
      expect(res.status).toBe(500)

      const body = await res.json()

      // 2. メッセージが "Internal Server Error" であること
      expect(body).toHaveProperty(
        'message',
        ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      )

      // 3. 詳細なエラー情報やスタックトレースが含まれていないこと
      expect(body).not.toHaveProperty('error')
      expect(body).not.toHaveProperty('stack')

      // 4. console.error が適切なメッセージとともに呼び出されたことを確認
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch bookmarks:',
        expect.any(Error),
      )
      expect(consoleSpy.mock.calls[0][1].message).toBe(
        'Database connection failed',
      )
    } finally {
      // スパイを解除して他のテストに影響を与えないようにする
      dbSpy.mockRestore()
      consoleSpy.mockRestore()
    }
  })
})
