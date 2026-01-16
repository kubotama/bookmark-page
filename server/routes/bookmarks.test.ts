import { describe, it, expect } from 'vitest'
import app from '../app'

describe('GET /api/bookmarks', () => {
  it('べきなレスポンス構造でブックマーク一覧を返すこと', async () => {
    const res = await app.request('/api/bookmarks')
    expect(res.status).toBe(200)
    
    const body = await res.json()
    
    // レスポンスが bookmarks キーを持つオブジェクトであることを確認
    expect(body).toHaveProperty('bookmarks')
    expect(Array.isArray(body.bookmarks)).toBe(true)
    
    // 各ブックマークが期待されるプロパティを持っていることを確認
    if (body.bookmarks.length > 0) {
      const bookmark = body.bookmarks[0]
      expect(bookmark).toHaveProperty('id')
      expect(bookmark).toHaveProperty('title')
      expect(bookmark).toHaveProperty('url')
      // createdAt は除外されたことを確認
      expect(bookmark).not.toHaveProperty('createdAt')
    }
  })
})
