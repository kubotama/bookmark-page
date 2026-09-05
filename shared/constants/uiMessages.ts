export const ERROR_MESSAGE = {
  SERVER_ERROR: 'サーバーエラーが発生しました',
  AUTH_ERROR: '認証エラー',
  DB_BINDING_ERROR: (binding: string) =>
    `データベース ${binding} のバインディングが設定されていません`,
  INSERT_BOOKMARK_ERROR: 'ブックマークの追加に失敗しました',
  STATUS_CODE: (code: number) => `ステータスコード: ${code}`,
  FAILED_DELETE_BOOKMARK: 'ブックマークの削除に失敗しました',
  FAILED_UPDATE_BOOKMARK: 'ブックマークの更新に失敗しました',
  INVALID_JSON_FORMAT: 'JSON形式が正しくありません',
  INSERT_KEYWORD_ERROR: 'キーワードの追加に失敗しました',
  INSERT_BKRELATION_ERROR: 'ブックマークとキーワードの関連付けに失敗しました',
  FAILED_ADD_KEYWORD: 'キーワードの登録に失敗しました',
  FAILED_UPDATE_KEYWORD: 'キーワードの更新に失敗しました',
} as const

export const UI_LABELS = {
  ACTIONS: {
    LOADING: '読み込み中...',
    ADDING_BOOKMARK: 'ブックマークを追加中...',
    ADD_BOOKMARK: 'ブックマークを追加',
    OPEN: '開く',
    UPDATE: '更新',
    DELETE: '削除',
    BACK: '戻る',
    SAVE_API_URL: 'APIのURLを保存',
    VERIFY_API_URL: 'APIのURLを検証',
    ADD_KEYWORD: '登録',
    KEYWORD_REGISTERED: '登録済',
    DETAIL: '詳細',
  },
  FIELDS: {
    TITLE: 'タイトル',
    URL: 'URL',
    API_URL: 'APIのURL',
    LINK_TEXT: 'リンク',
    ASSIGNED_KEYWORD: '関連付けられているキーワード',
    UNASSIGNED_KEYWORD: '関連付けられていないキーワード',
    ADD_KEYWORD: '登録するキーワード',
    KEYWORD_NAME: 'キーワード名',
  },
  HEADER: {
    PAGE_HEADER: 'Bookmark Page',
    KEYWORD: 'キーワード',
    NO_BOOKMARKS: 'ブックマークがありません。',
    ADD_BOOKMARK: 'ブックマークの追加',
    NO_KEYWORDS: 'キーワードがありません。',
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
    ADDED_BOOKMARK: 'ブックマークを追加しました！',
    REGISTERED_BOOKMARKS: (count: number) =>
      `${count}件のブックマークが登録されています。`,
    CONFIRM_DELETE: (title: string) =>
      `「${title}」を削除してもよろしいですか？`,
  },
  API: {
    DB_ERROR: 'データベースにエラーが発生しました',
    SAVED_API_URL: 'APIのURLを保存しました。',
    FAILED_SAVE_API_URL: 'APIのURLの保存に失敗しました。',
    FAILED_CONNECT_SERVER:
      '接続に失敗しました。URLまたはサーバーの状態を確認してください。',
    TIMEOUT_CONNECT_SERVER:
      '接続がタイムアウトしました。URLが正しいか確認してください。',
    NOT_FOUND_BOOKMARK: '指定されたブックマークが見つかりません。',
    DUPLICATE_URL: 'このURLは既に登録されています。',
    DUPLICATE_KEYWORD: 'このキーワードは既に登録されています。',
    DUPLICATE_BKRELATION:
      'このブックマークとキーワードは既に関連付けられています。',
    NOT_FOUND_KEYWORD: '指定されたキーワードが見つかりません。',
  },
  OTHER: {
    UNEXPECTED_ERROR: '予期せぬエラーが発生しました。',
  },
} as const
