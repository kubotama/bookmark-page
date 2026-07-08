export const API_PATH = {
  ROOT: '/api',
  GET_BOOKMARKS: '/bookmarks',
} as const

// フォールバック用のデフォルトURL（未設定時の挙動対策）
export const DEFAULT_API_URL = 'http://localhost:8788'

export const TIMEOUT_MILLISECOND = 5000
