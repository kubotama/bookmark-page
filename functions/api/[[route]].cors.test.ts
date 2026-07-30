import { describe, expect, it } from 'vitest'

import { app } from './[[route]]'

describe('CORS Middleware', () => {
  it('Chrome拡張機能からのオリジン (chrome-extension://) を許可すること', async () => {
    const res = await app.request('/api/bookmarks', {
      headers: {
        'Access-Control-Request-Method': 'GET',
        Origin: 'chrome-extension://abcdefghijklmnopqrstuvwxyz',
      },
      method: 'OPTIONS',
    })
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
      'chrome-extension://abcdefghijklmnopqrstuvwxyz',
    )
  })

  it('ローカル開発環境のオリジン (http://localhost:5173) を許可すること', async () => {
    const res = await app.request('/api/bookmarks', {
      headers: {
        'Access-Control-Request-Method': 'GET',
        Origin: 'http://localhost:5173',
      },
      method: 'OPTIONS',
    })
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
      'http://localhost:5173',
    )
  })

  it('Pagesデプロイ環境のオリジン (*.pages.dev) を許可すること', async () => {
    const res = await app.request('/api/bookmarks', {
      headers: {
        'Access-Control-Request-Method': 'GET',
        Origin: 'https://bookmark-page.pages.dev',
      },
      method: 'OPTIONS',
    })
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://bookmark-page.pages.dev',
    )
  })

  it('許可されていない外部オリジンからのアクセスを拒否すること', async () => {
    const res = await app.request('/api/bookmarks', {
      headers: {
        'Access-Control-Request-Method': 'GET',
        Origin: 'https://malicious-site.com',
      },
      method: 'OPTIONS',
    })
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })

  it('不正な形式のOriginヘッダーでもエラーにならず拒否されること', async () => {
    const res = await app.request('/api/bookmarks', {
      headers: {
        'Access-Control-Request-Method': 'GET',
        Origin: 'invalid-url-string',
      },
      method: 'OPTIONS',
    })
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })
})
