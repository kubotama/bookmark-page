import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite' // 追加

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: './src', // Reactのソースコードの場所
  resolve: {
    alias: {
      '@functions': resolve(__dirname, './functions'),
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8788', // Wrangler Pagesのデフォルトポート
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts', 'extension/src/test/setup.ts'],

    root: resolve(__dirname, '.'),

    include: [
      'src/**/*.test.{ts,tsx}',
      'functions/**/*.test.{ts,tsx}',
      'extension/**/*.test.{ts,tsx}',
    ],

    coverage: {
      provider: 'v8',
      include: [
        'src/**/*.{ts,tsx}',
        'functions/**/*.{ts,tsx}',
        'extension/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        'src/main.tsx',
        'src/test/setup.ts',
        'functions/schemas/**',
        'functions/constants/**',
        'functions/test/**',
        'extension/src/constants/**',
      ],
    },
  },
})
