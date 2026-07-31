import tailwindcss from '@tailwindcss/vite' // 追加
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: '../dist',
  },
  plugins: [
    tanstackRouter({
      generatedRouteTree: resolve(__dirname, './src/routeTree.gen.ts'),
      routeFileIgnorePattern: '((\\.|/)(test|spec))|\\.stories\\.',
      // 💡 2. __dirname（このファイルがある場所）を基準に、絶対パスに変換する
      routesDirectory: resolve(__dirname, './src/routes'),
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@functions': resolve(__dirname, './functions'),
    },
  },
  root: './src', // Reactのソースコードの場所
  server: {
    port: 5173,
    proxy: {
      '/api': {
        changeOrigin: true,
        target: 'http://localhost:8788', // Wrangler Pagesのデフォルトポート
      },
    },
  },
  test: {
    coverage: {
      clean: true,
      exclude: [
        '**/*.test.{ts,tsx}',
        'src/main.tsx',
        'src/test/**.{ts,tsx}',
        'src/routeTree.gen.ts',
        'functions/schemas/**',
        'functions/constants/**',
        'functions/test/**',
        'extension/src/constants/**',
      ],
      include: [
        'src/**/*.{ts,tsx}',
        'functions/**/*.{ts,tsx}',
        'extension/**/*.{ts,tsx}',
        'shared/lib/**/*.{ts,tsx}',
      ],
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    environment: 'jsdom',
    globals: true,

    include: [
      'src/**/*.test.{ts,tsx}',
      'functions/**/*.test.{ts,tsx}',
      'extension/**/*.test.{ts,tsx}',
      'shared/lib/**/*.test.{ts,tsx}',
    ],

    root: resolve(__dirname, '.'),

    setupFiles: ['src/test/setup.ts', 'extension/src/test/setup.ts'],
  },
})
