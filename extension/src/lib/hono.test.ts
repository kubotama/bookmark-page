import { describe, it, expect } from 'vitest'
import { client } from './hono'

describe('Hono RPC Client', () => {
  it('client が正常に初期化されていること', () => {
    expect(client).toBeDefined()
    expect(client.api.bookmarks).toBeDefined()
    expect(typeof client.api.bookmarks.$post).toBe('function')
  })
})
