import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.resolve(process.cwd(), 'bookmarks.sqlite')
export const db = new Database(dbPath)

// スキーマ定義
const SCHEMA = `
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
    bookmark_id INTEGER,
    keyword_id INTEGER,
    FOREIGN KEY (bookmark_id) REFERENCES bookmarks(bookmark_id) ON DELETE CASCADE,
    FOREIGN KEY (keyword_id) REFERENCES keywords(keyword_id) ON DELETE CASCADE,
    UNIQUE (bookmark_id, keyword_id)
  );
  CREATE INDEX IF NOT EXISTS idx_bookmark_keywords_keyword_id ON bookmark_keywords(keyword_id);
`

// データベースの初期化と設定
const initializeDatabase = () => {
  // 1. 接続ごとの設定（外部キー有効化）
  db.pragma('foreign_keys = ON')

  // 2. DBファイル全体の設定（WALモード: パフォーマンス向上）
  db.pragma('journal_mode = WAL')

  // 3. テーブル・インデックスの作成
  db.exec(SCHEMA)
}

// 初期化実行（PRAGMA設定とスキーマ作成を一括で行う）
initializeDatabase()

// アプリケーション終了時にデータベース接続を閉じる
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
