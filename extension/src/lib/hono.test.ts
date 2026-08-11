import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ZodError } from 'zod'

import { INVALID_STRING } from '../../../functions/test/fixtures'
import { DEFAULT_API_URL } from '../../../shared/constants/api'
import { SCHEMA_MESSAGE } from '../../../shared/constants/validation'
import { createClient } from './hono'

describe('Hono RPC Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('client が正常に初期化されていること', () => {
    const client = createClient({ apiUrl: DEFAULT_API_URL })

    expect(client).toBeDefined()
    expect(client.api.bookmarks).toBeDefined()
    expect(typeof client.api.bookmarks.$post).toBe('function')
  })

  it('urlが不正な場合にはclientが作成されない、例外を返すこと', () => {
    let client
    try {
      client = createClient({ apiUrl: INVALID_STRING.URL })
    } catch (error) {
      if (error instanceof ZodError) {
        expect(error.issues[0].message).toBe(SCHEMA_MESSAGE.PROTOCOL_CONSTRAINT)
        expect(client).not.toBeDefined()
      } else {
        expect(error).toBeInstanceOf(ZodError)
      }
    }
  })

  it('fetch に credentials: include と signal が設定されること', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ data: [], success: true })),
      )

    const client = createClient({ apiUrl: DEFAULT_API_URL })
    await client.api.bookmarks.$get()

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        credentials: 'include',
        signal: expect.any(AbortSignal),
      }),
    )
  })
})
