import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import App from "./App"

describe("App Component (MVP Bookmark List)", () => {
  beforeEach(() => {
    // 各テストの前に、fetchのモックをリセットする
    vi.restoreAllMocks()
  })

  it("データ取得中に「読み込み中...」が表示されること", () => {
    // 応答を遅延させるダミーのfetchモック
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () => new Promise(() => {}),
    )

    render(<App />)
    expect(screen.getByText("読み込み中...")).toBeInTheDocument()
  })

  it("APIから取得したブックマーク一覧が正しく画面にレンダリングされること", async () => {
    // 模擬的なAPIレスポンスを設定
    const mockData = {
      success: true,
      data: [
        { id: "1", title: "テスト駆動開発", url: "https://example.com/tdd" },
        { id: "2", title: "Cloudflare D1", url: "https://example.com/d1" },
      ],
    }

    // fetchの戻り値をモック化
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      json: async () => mockData,
    } as Response)

    render(<App />)

    // 非同期でデータが読み込まれ、タイトルが表示されるのを待つ
    await waitFor(() => {
      expect(screen.getByText("テスト駆動開発")).toBeInTheDocument()
      expect(screen.getByText("Cloudflare D1")).toBeInTheDocument()
    })

    // リンクが正しいURLを持っているか検証
    const linkElement = screen.getByText("テスト駆動開発") as HTMLAnchorElement
    expect(linkElement.href).toBe("https://example.com/tdd")
  })

  it("データが空の場合に適切なメッセージが表示されること", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      json: async () => ({ success: true, data: [] }),
    } as Response)

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText("ブックマークがありません。")).toBeInTheDocument()
    })
  })

  it("APIがエラーの場合にはエラーメッセージが返されること", async () => {
    const fetchError = new TypeError("Failed to fetch")
    vi.spyOn(globalThis, "fetch").mockRejectedValue(fetchError)
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    render(<App />)
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("データ取得失敗:", fetchError)
    })
  })
})
