export const ERROR_MESSAGE = {
  SERVER_ERROR: 'サーバーエラーが発生しました',
  AUTH_ERROR: '認証エラー',
  DB_BINDING_ERROR: (binding: string) =>
    `データベース ${binding} のバインディングが設定されていません`,
  INSERT_BOOKMARK_ERROR: 'ブックマークの追加に失敗しました',
  STATUS_CODE: (code: number) => `ステータスコード: ${code}`,
} as const

export const UI_LABELS = {
  ACTIONS: {
    LOADING: '読み込み中...',
    SAVING: '保存中...',
    SAVE: '保存する',
    SAVE_API_URL: 'APIのURLを保存',
    VERIFY_API_URL: 'APIのURLを検証',
  },
  FIELDS: {
    TITLE: 'タイトル',
    URL: 'URL',
    API_URL: 'APIのURL',
  },
  HEADER: {
    MY_BOOKMARKS: 'マイブックマーク',
    NO_BOOKMARKS: 'ブックマークがありません。',
  },
} as const

export const UI_MESSAGES = {
  AUTH: {
    INVALID_RESPONSE:
      'APIから不正な応答（HTML）が返されました。Zero Trustのバイパス設定を確認してください。',
    ZERO_TRUST_AUTH_ERROR:
      'Zero Trust のログインセッションが見つかりません。先にブラウザでWEB画面を開いてログインしてください。',
  },
  BOOKMARKS: {
    SAVED_BOOKMARK: 'ブックマークを保存しました！',
    REGISTERED_BOOKMARKS: (count: number) =>
      `${count}件のブックマークが登録されています。`,
  },
  API: {
    SAVED_API_URL: 'APIのURLを保存しました。',
    FAILED_SAVE_API_URL: 'APIのURLの保存に失敗しました。',
    FAILED_CONNECT_SERVER:
      '接続に失敗しました。URLまたはサーバーの状態を確認してください。',
    TIMEOUT_CONNECT_SERVER:
      '接続がタイムアウトしました。URLが正しいか確認してください。',
  },
} as const
