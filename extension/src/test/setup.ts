import { vi } from 'vitest'
import '@testing-library/jest-dom'
import { TestBookmarks } from '../../../functions/test/fixtures'

// 💡 1. すでにグローバルに存在する chrome の型を安全に取得
type ChromeType = typeof globalThis.chrome

// 💡 2. モックオブジェクトを型安全に定義（Partial で必要な箇所だけモック化）
const chromeMock: Partial<ChromeType> = {
  tabs: {
    query: vi.fn((_queryInfo, callback) => {
      if (callback) {
        callback([{ title: TestBookmarks[0].title, url: TestBookmarks[0].url }])
      }
    }),
  } as unknown as ChromeType['tabs'], // 内部の深い未実装プロパティを回避するための型安全なキャスト

  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    },
  } as unknown as ChromeType['storage'],
}

// 💡 3. グローバルオブジェクトに安全に代入
globalThis.chrome = chromeMock as unknown as ChromeType
