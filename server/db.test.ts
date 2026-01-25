import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { z } from 'zod'
import { db, initializeDatabase, resetDatabase } from './db'
import { LOG_MESSAGES } from '@shared/constants'

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

  const DDL_ERROR_MSG = 'DDL Error'
  const SEED_DATA = { title: 'Initial', url: 'https://initial.com' }
  const AFTER_RESET_DATA = {
    title: 'Test after reset',
    url: 'https://test.com',
  }

  describe('initializeDatabase', () => {
    it('正常に初期化が行われること', () => {
      expect(() => initializeDatabase()).not.toThrow()
    })

    it('DDL実行失敗時にエラーをスローしログを出力すること', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const dbSpy = vi.spyOn(db, 'exec').mockImplementation(() => {
        throw new Error(DDL_ERROR_MSG)
      })

      expect(() => initializeDatabase()).toThrow(DDL_ERROR_MSG)
      expect(dbSpy).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(LOG_MESSAGES.DB_INIT_FAILED, expect.any(Error))
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
        SEED_DATA.title,
        SEED_DATA.url,
      )

      // 2. リセット実行
      resetDatabase()

      // 3. 削除されているか確認
      const count = z
        .object({ count: z.number() })
        .parse(db.prepare('SELECT COUNT(*) as count FROM bookmarks').get())
      expect(count.count).toBe(0)

      // 4. 次の挿入でIDが1から始まることを確認
      const info = db
        .prepare('INSERT INTO bookmarks (title, url) VALUES (?, ?)')
        .run(AFTER_RESET_DATA.title, AFTER_RESET_DATA.url)
      expect(info.lastInsertRowid).toBe(1)
    })
  })
})