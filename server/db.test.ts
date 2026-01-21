import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { db, initializeDatabase, resetDatabase } from './db'

describe('db.ts', () => {
  beforeEach(() => {
    // 確実にテスト環境で初期化
    vi.stubEnv('NODE_ENV', 'test')
    initializeDatabase()
    resetDatabase()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  describe('initializeDatabase', () => {
    it('正常に初期化が行われること', () => {
      expect(() => initializeDatabase()).not.toThrow()
    })

    it('DDL実行失敗時にエラーをスローしログを出力すること', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const dbSpy = vi.spyOn(db, 'exec').mockImplementation(() => {
        throw new Error('DDL Error')
      })

      expect(() => initializeDatabase()).toThrow('DDL Error')
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to initialize database:',
        expect.any(Error),
      )
    })

    it('テスト環境以外では WAL モードが設定されること', () => {
      vi.stubEnv('NODE_ENV', 'development')
      const pragmaSpy = vi.spyOn(db, 'pragma')

      initializeDatabase()

      expect(pragmaSpy).toHaveBeenCalledWith('journal_mode = WAL')
    })
  })

  describe('resetDatabase', () => {
    it('テスト環境以外で実行した場合にエラーを投げること', () => {
      vi.stubEnv('NODE_ENV', 'development')
      expect(() => resetDatabase()).toThrow(
        'resetDatabase can only be called in test environment',
      )
    })

    it('全てのユーザテーブルからデータが削除され、sequenceがリセットされること', () => {
      vi.stubEnv('NODE_ENV', 'test')
      // 1. データを挿入（これにより自動的に sequence が生成/更新される）
      db.prepare('INSERT INTO bookmarks (title, url) VALUES (?, ?)').run(
        'Initial',
        'https://initial.com',
      )

      // 2. リセット実行
      resetDatabase()

      // 3. 削除されているか確認
      const count = db.prepare('SELECT COUNT(*) as count FROM bookmarks').get() as {
        count: number
      }
      expect(count.count).toBe(0)

      // 4. 次の挿入でIDが1から始まることを確認
      const info = db
        .prepare('INSERT INTO bookmarks (title, url) VALUES (?, ?)')
        .run('Test after reset', 'https://test.com')
      expect(info.lastInsertRowid).toBe(1)
    })
  })
})
