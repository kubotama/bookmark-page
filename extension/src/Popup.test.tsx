import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Popup } from './Popup'
import { client } from './lib/hono'

// 💡 Hono RPC クライアントの通信部分をモック化
vi.mock('./lib/hono', () => {
  return {
    client: {
      api: {
        bookmarks: {
          $post: vi.fn(() => ({
            ok: true,
            json: async () => ({ success: true }),
          })),
        },
      },
    },
  }
})

describe.skip('Popup Component', () => {
  it('起動時に chrome.tabs.query からタイトルとURLを取得して入力欄にセットすること', () => {
    render(<Popup />)

    // setup.ts で仕込んだモックデータが入っているか検証
    const titleInput = screen.getByLabelText('タイトル') as HTMLInputElement
    const urlInput = screen.getByLabelText('URL') as HTMLInputElement

    expect(titleInput.value).toBe('テストページ')
    expect(urlInput.value).toBe('https://test.com')
  })

  it('保存するボタンを押した際、Hono RPC APIが正しく呼び出されること', async () => {
    render(<Popup />)

    const submitButton = screen.getByRole('button', { name: '保存する' })
    fireEvent.click(submitButton)

    // 保存中の状態を経て、成功メッセージが出ることを検証
    await waitFor(() => {
      expect(
        screen.getByText('ブックマークを保存しました！'),
      ).toBeInTheDocument()
    })

    // APIがどんな引数で呼ばれたかを検証
    expect(client.api.bookmarks.$post).toHaveBeenCalledWith({
      json: {
        title: 'テストページ',
        url: 'https://test.com',
      },
    })
  })
})
