export const ERROR_MESSAGE = {
  SERVER_ERROR: 'サーバーエラーが発生しました',
  API_ERROR: 'APIへのアクセスにエラーが発生しました',
  DB_ERROR: 'データベースにエラーが発生しました',
  DB_BINDING_ERROR: (binding: string) =>
    `Database binding ${binding} is not configured.`,
  INSERT_BOOKMARK_ERROR: 'ブックマークの追加に失敗しました',
} as const

export const DISPLAY_TEXT = {
  LOADING: '読み込み中...',
  SAVING: '保存中...',
  SAVE: '保存する',
  TITLE: 'タイトル',
  URL: 'URL',
  SAVED_BOOKMARK: 'ブックマークを保存しました！',
  FALED_CONNECT_SERVER: 'サーバーとの通信に失敗しました。',
  MY_BOOKMARKS: 'マイブックマーク',
  NO_BOOKMARKS: 'ブックマークがありません。',
} as const

export const LOG_MESSAGE = {
  DB_ERROR: (message: unknown) => `database error: ${message}`,
  MANIFEST_COPY_ERROR: (error: unknown) => `Manifest copy failed: ${error}`,
} as const

export const API_MESSAGE = {
  FAILED_CONNECT_DATABASE: 'データベースの接続に失敗しました',
} as const

export const DEFAULT_TEXT = {
  TITLE: '開発用テストタイトル',
  URL: 'https://example.com',
} as const

export const SCHEMA_MESSAGE = {
  INVALID_URL: '不正なURL形式です',
} as const
