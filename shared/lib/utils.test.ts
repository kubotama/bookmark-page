import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
  it('クラス名を正しく結合し、Tailwindの衝突を解決すること', () => {
    // 条件付き結合の検証
    expect(cn('px-2', true && 'py-2', false && 'bg-blue-500')).toBe('px-2 py-2')

    // Tailwindクラス衝突の解消（後の記述が優先されるか）の検証
    expect(cn('p-4 bg-red-500', 'p-6 bg-blue-500')).toBe('p-6 bg-blue-500')
  })
})
