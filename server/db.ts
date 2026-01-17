import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.resolve(process.cwd(), 'bookmarks.sqlite')
export const db = new Database(dbPath)

// 開発中のデバッグ用に WAL モードなどを設定
db.pragma('journal_mode = WAL')

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
