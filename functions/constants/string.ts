export const ERROR_MESSAGE = {
  SERVER_ERROR: 'サーバーエラーが発生しました',
  API_ERROR: 'APIへのアクセスにエラーが発生しました',
  DB_ERROR: 'データベースにエラーが発生しました',
  DB_BINDING_ERROR: (binding: string) =>
    `Database binding ${binding} is not configured.`,
  INSERT_BOOKMARK_ERROR: 'ブックマークの追加に失敗しました',
  STATUS_CODE: (code: number) => `ステータスコード: ${code}`,
} as const

export const DISPLAY_TEXT = {
  LOADING: '読み込み中...',
  SAVING: '保存中...',
  SAVE: '保存する',
  SAVE_API_URL: 'APIのURLを保存',
  VERIFY_API_URL: 'APIのURLを検証',
  TITLE: 'タイトル',
  URL: 'URL',
  API_URL: 'APIのURL',
  SAVED_BOOKMARK: 'ブックマークを保存しました！',
  SAVED_API_URL: 'APIのURLを保存しました。',
  FAILED_SAVE_API_URL: 'APIのURLの保存に失敗しました。',
  FAILED_CONNECT_SERVER:
    '接続に失敗しました。URLまたはサーバーの状態を確認してください。',
  TIMEOUT_CONNECT_SERVER:
    '接続がタイムアウトしました。URLが正しいか確認してください。',
  INVALID_RESPONSE:
    'APIから不正な応答（HTML）が返されました。Zero Trustのバイパス設定を確認してください。',
  INVALID_URL_FORMAT: 'URLが不正です。',
  MY_BOOKMARKS: 'マイブックマーク',
  NO_BOOKMARKS: 'ブックマークがありません。',
  REGISTERED_BOOKMARKS: (count: number) =>
    `${count}件のブックマークが登録されています。`,
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
