import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { mkdirSync, writeFileSync, readFileSync } from 'fs'
import tailwindcss from '@tailwindcss/vite' // 追加

const copyManifest = () => {
  return {
    name: 'copy-manifest',
    closeBundle() {
      try {
        mkdirSync(resolve(__dirname, 'extension/dist-extension'), {
          recursive: true,
        })
        const manifest = readFileSync(
          resolve(__dirname, 'extension/manifest.json'),
          'utf-8',
        )
        writeFileSync(
          resolve(__dirname, 'extension/dist-extension/manifest.json'),
          manifest,
        )
      } catch (e) {
        console.error(`Manifest copy failed: ${e}`)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), copyManifest()],
  root: resolve(__dirname, 'extension'), // 💡 ルートからの相対パスに指定
  build: {
    outDir: resolve(__dirname, 'extension/dist-extension'), // 出力先
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'extension/index.html'),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
