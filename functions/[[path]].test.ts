import { describe, it, expect } from 'vitest'
import { app } from './[[path]]' // 💡 exportしたappをインポート
import { TestBookmarks } from './test/fixtures'

describe('Hono Backend API - app.request', () => {
  it('GET /api/bookmarks が正しいJSONを返すこと', async () => {
    // 💡 実際のURLではなく、パスを指定して直接リクエストを流し込む
    const res = await app.request('/api/bookmarks')

    // ステータスコードの検証
    expect(res.status).toBe(200)

    // レスポンスボディの検証
    const body = await res.json()
    expect(body).toEqual({
      success: true,
      data: TestBookmarks,
    })
  })

  it('存在しないパスにアクセスした場合は404になること', async () => {
    const res = await app.request('/api/unknown-route')
    expect(res.status).toBe(404)
  })
})
