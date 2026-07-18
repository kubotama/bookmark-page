export const LENGTH_LIMITATION = {
  URL: { MAX: 2048 },
  TITLE: { MIN: 1, MAX: 255 },
} as const

export const SCHEMA_MESSAGE = {
  URL_REQUIRED: 'URLは必須です',
  TITLE_REQUIRED: 'タイトルは必須です',
  MIN_LENGTH_TITLE: `タイトルは${LENGTH_LIMITATION.TITLE.MIN}文字以上で入力してください`,
  MAX_LENGTH_TITLE: `タイトルは${LENGTH_LIMITATION.TITLE.MAX}文字以内で入力してください`,
  MAX_LENGTH_URL: `URLは${LENGTH_LIMITATION.URL.MAX}文字以内で入力してください`,
  INVALID_URL: '不正なURL形式です',
  INVALID_ID_FORMAT: '無効なID形式です',
} as const
