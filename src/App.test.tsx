import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { TestBookmarks } from "@functions/test/fixtures"
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
    // fetchの戻り値をモック化
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        return {
          success: true,
          data: TestBookmarks,
        }
      },
    } as Response)

    render(<App />)

    // 非同期でデータが読み込まれ、タイトルが表示されるのを待つ
    await waitFor(() => {
      expect(screen.getByText(TestBookmarks[0].title)).toBeInTheDocument()
      expect(screen.getByText(TestBookmarks[1].title)).toBeInTheDocument()
    })

    // リンクが正しいURLを持っているか検証
    const linkElement = screen.getByText(
      TestBookmarks[0].title,
    ) as HTMLAnchorElement
    expect(linkElement.href).toBe(TestBookmarks[0].url)
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
