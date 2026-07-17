export const API_PATH = {
  ROOT: '/api',
  GET_BOOKMARKS: '/bookmarks',
  DELETE_BOOKMARK: `/bookmarks/:id`,
} as const

// フォールバック用のデフォルトURL（未設定時の挙動対策）
export const DEFAULT_API_URL = 'http://localhost:8788'

export const TIMEOUT_MILLISECOND = 5000

export const API_MESSAGE = {
  DB_ERROR: 'データベースにエラーが発生しました',
  FAILED_CONNECT_DATABASE: 'データベースの接続に失敗しました',
} as const
