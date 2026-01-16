import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.resolve(process.cwd(), 'bookmarks.sqlite')
export const db = new Database(dbPath)

// 開発中のデバッグ用に WAL モードなどを設定
db.pragma('journal_mode = WAL')
