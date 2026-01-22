export const ERROR_MESSAGES = {
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
} as const

export const UI_MESSAGES = {
  ERROR_PREFIX: 'エラーが発生しました',
  UNEXPECTED_ERROR: '予期せぬエラーが発生しました',
  NO_BOOKMARKS: 'ブックマークがありません。',
  LOADING_LABEL: '読み込み中...',
  FETCH_FAILED: 'ブックマークの取得に失敗しました',
} as const

export const API_PATHS = {
  BOOKMARKS: '/api/bookmarks',
} as const
