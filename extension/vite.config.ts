import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { mkdirSync, writeFileSync, readFileSync } from 'fs'
import { LOG_MESSAGE } from '../functions/constants/string'

// 💡 manifest.json を dist にコピーするシンプルなカスタムプラグイン
const copyManifest = () => {
  return {
    name: 'copy-manifest',
    closeBundle() {
      try {
        mkdirSync(resolve(__dirname, 'dist'), { recursive: true })
        const manifest = readFileSync(
          resolve(__dirname, 'manifest.json'),
          'utf-8',
        )
        writeFileSync(resolve(__dirname, 'dist/manifest.json'), manifest)
      } catch (e) {
        console.error(LOG_MESSAGE.MANIFEST_COPY_ERROR(e))
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), copyManifest()],
  root: resolve(__dirname),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },

})
