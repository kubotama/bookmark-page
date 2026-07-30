import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import perfectionist from 'eslint-plugin-perfectionist'

export default [
  {
    ignores: ['node_modules/**', 'dist/**', '.wrangler/**', 'coverage/**'],
  },
  {
    // 解析対象にするファイル
    files: [
      'src/**/*.{ts,tsx}',
      'functions/**/*.{ts,tsx}',
      'vite.config.ts',
      'extension/**/*.{ts,tsx}',
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // 開発を円滑にしつつ、最低限の品質を保つルール
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn', // anyは警告（徐々に無くしていくため）
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ], // _で始まる変数は未使用でも許容
    },
  },
  perfectionist.configs['recommended-natural'],
]
