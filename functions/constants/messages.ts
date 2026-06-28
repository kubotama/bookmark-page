export const ERROR_MESSAGE = {
  SERVER_ERROR: 'サーバーエラーが発生しました',
  API_ERROR: 'APIへのアクセスにエラーが発生しました',
  DB_ERROR: 'データベースにエラーが発生しました',
  DB_BINDING_ERROR: (binding: string) =>
    `Database binding ${binding} is not configured.`,
} as const

export const DISPLAY_TEXT = {
  LOADING: '読み込み中...',
  MY_BOOKMARKS: 'マイブックマーク',
  NO_BOOKMARKS: 'ブックマークがありません。',
} as const

export const LOG_MESSAGE = {
  DB_ERROR: (message: unknown) => `database error: ${message}`,
} as const

export const API_MESSAGE = {
  FAILED_CONNECT_DATABASE: 'データベースの接続に失敗しました',
} as const
