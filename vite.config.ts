import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

export default defineConfig({
  plugins: [react()],
  root: "./src", // Reactのソースコードの場所
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8788", // Wrangler Pagesのデフォルトポート
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "../dist", // ビルド成果物はルートの dist ディレクトリへ
    emptyOutDir: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "src/test/setup.ts",

    root: resolve(__dirname, "."),

    // 起点がルートに変わったため、テスト対象のパス指定をルート基準に修正します
    include: ["src/**/*.test.{ts,tsx}", "functions/**/*.test.{ts,tsx}"],

    coverage: {
      provider: "v8",
      // プロジェクトルート基準のクリーンなパス指定
      include: ["src/**/*.{ts,tsx}", "functions/**/*.{ts,tsx}"],
      exclude: ["**/*.test.{ts,tsx}", "src/main.tsx", "src/test/setup.ts"],
    },
  },
})
