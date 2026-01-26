import Database from 'better-sqlite3'
import path from 'path'
import { z } from 'zod'
import { LOG_MESSAGES } from '@shared/constants'

const isTestEnvironment = () => process.env.NODE_ENV === 'test'

const getDbPath = () => {
  return isTestEnvironment()
    ? ':memory:'
    /* v8 ignore next 2 */
    // テスト実行時は常に :memory: を使用するため、物理パスの生成は計測から除外する
    : path.resolve(process.cwd(), 'bookmarks.sqlite')
}

export const db = new Database(getDbPath())

// スキーマ定義
export const SCHEMA = `
  CREATE TABLE IF NOT EXISTS bookmarks (
    bookmark_id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS keywords (
    keyword_id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword_name TEXT NOT NULL UNIQUE
  );
  CREATE TABLE IF NOT EXISTS bookmark_keywords (
    bookmark_keyword_id INTEGER PRIMARY KEY AUTOINCREMENT,
    bookmark_id INTEGER NOT NULL,
    keyword_id INTEGER NOT NULL,
    FOREIGN KEY (bookmark_id) REFERENCES bookmarks(bookmark_id) ON DELETE CASCADE,
    FOREIGN KEY (keyword_id) REFERENCES keywords(keyword_id) ON DELETE CASCADE,
    UNIQUE (bookmark_id, keyword_id)
  );
  CREATE INDEX IF NOT EXISTS idx_bookmark_keywords_keyword_id ON bookmark_keywords(keyword_id);
`

// データベースの初期化と設定
export const initializeDatabase = () => {
  const isTest = isTestEnvironment()
  try {
    // 1. 接続ごとの設定（外部キー有効化）
    db.pragma('foreign_keys = ON')

    // 2. DBファイル全体の設定（WALモード: パフォーマンス向上）
    if (!isTest) {
      db.pragma('journal_mode = WAL')
    }

    // 3. テーブル・インデックスの作成
    db.transaction(() => {
      db.exec(SCHEMA)
    })()
  } catch (error) {
    console.error(LOG_MESSAGES.DB_INIT_FAILED, error)
    throw error
  }
}

// データベースを空にする（テスト用）
export const resetDatabase = () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('resetDatabase can only be called in test environment')
  }

  // ユーザ定義テーブルの一覧を取得（sqlite_sequence などのシステムテーブルを除外）
  const tableSchema = z.object({ name: z.string() })
  const tables = z
    .array(tableSchema)
    .parse(
      db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
        )
        .all(),
    )

  // 外部キー制約を一時的に無効化（トランザクションの外で実行する必要がある）
  db.pragma('foreign_keys = OFF')

  try {
    db.transaction(() => {
      for (const { name } of tables) {
        // テーブル名はダブルクォーテーションでクオートして保護
        db.prepare(`DELETE FROM "${name}"`).run()
        // IDリセット（sqlite_sequence テーブルが存在する場合のみ有効）
        db.prepare('DELETE FROM sqlite_sequence WHERE name = ?').run(name)
      }
    })()
  } finally {
    // 確実に外部キー制約を元に戻す
    db.pragma('foreign_keys = ON')
  }
}

/* v8 ignore start */
// アプリケーション終了時にデータベース接続を閉じる。
// これらの終了処理は通常のテスト実行プロセス中には実行されないため、カバレッジ計測から除外する。
const shutdown = () => {
  if (db.open) {
    db.close()
  }
  process.exit(0)
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
process.on('exit', () => {
  if (db.open) {
    db.close()
  }
})
/* v8 ignore stop */
