import { beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from './[[route]]' // appのインポートパスは環境に合わせて調整してください
import { REQUEST_API_PATH, TestBookmarks } from '../test/fixtures'
import { D1Database } from '@cloudflare/workers-types'
import { BOOKMARKS } from '../constants/db'

// D1 データベースの準備（モック用）

describe('Hono API - PATCH /api/bookmarks/:id', () => {
  const mockPrepare = vi.fn()
  const mockBind = vi.fn()
  const mockRun = vi.fn()
  const updateBookmark = TestBookmarks[0]
  const requestBody = {
    title: updateBookmark.title,
    url: updateBookmark.url,
  }

  beforeEach(() => {
    vi.resetAllMocks()
    mockPrepare.mockReturnValue({ bind: mockBind })
    mockBind.mockReturnValue({
      run: mockRun,
    })
  })

  it('正常系: 有効なパラメータを送信したとき、ブックマークが更新されて200を返すこと', async () => {
    mockRun.mockResolvedValueOnce({ success: true, meta: { changes: 1 } })

    const mockD1Database: Partial<D1Database> = {
      prepare: mockPrepare as D1Database['prepare'],
    }

    const res = await app.request(
      REQUEST_API_PATH.UPDATE_BOOKMARK(updateBookmark.id),
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
      {
        BOOKMARK_PAGE_DB: mockD1Database as D1Database,
      },
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.title).toBe(updateBookmark.title)
    expect(json.data.url).toBe(updateBookmark.url)
    expect(json.data.id).toBe(updateBookmark.id)

    expect(mockPrepare).toHaveBeenCalledWith(BOOKMARKS.UPDATE)
    expect(mockBind).toHaveBeenCalledWith(
      requestBody.title,
      requestBody.url,
      updateBookmark.id,
    )
  })
})
