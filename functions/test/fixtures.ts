import { Bookmark, CreateBookmarkSchema } from '../schemas/bookmark'

// MVP用のダミーデータ
export const TestBookmarks: Bookmark[] = [
  {
    id: '018ed000-0001-7000-8000-000000000001',
    title: 'Hono',
    url: 'https://hono.dev/',
  },
  {
    id: '018ed000-0001-7000-8000-000000000002',
    title: 'Vite',
    url: 'https://vitejs.dev/',
  },
]

export const mockBookmarksData = {
  data: TestBookmarks,
  success: true,
}

export const BookmarksTableData = {
  created_at: '2026-06-28 11:30:00',
  id: '7488a6de-412d-4076-905e-8848d79cb6ee',
  title: 'Vite 公式サイト',
  url: 'https://vite.dev',
} as const

export const TEST_STRING = {
  BUTTON_LABEL: 'ボタン',
} as const

export const INVALID_STRING = {
  FTP: 'ftp://ftp.com',
  ID: 'not-found-id',
  URL: 'not-a-valid-url',
} as const

export const TEST_ERROR_MESSAGE = {
  API_ERROR: 'APIへのアクセスにエラーが発生しました',
  CONSTRAINT_ERROR: 'UNIQUE constraint failed: bookmarks.url',
  DB_ERROR: 'データベースにエラーが発生しました',
  NETWORK_ERROR: 'ネットワークにエラーが発生しました',
} as const

export const TEST_API_URL = {
  LOCAL: 'http://localhost:54321',
} as const

export const getExpectedText = (
  schema: typeof CreateBookmarkSchema,
  body: { title: string; url: string },
  name: string,
) => {
  const schemaResult = schema.safeParse(body)

  // safeParse が失敗したときの中身から、title に関するエラーメッセージを抽出
  return schemaResult.success
    ? ''
    : schemaResult.error.issues.find((issue) => issue.path[0] === name)?.message
}

export const REQUEST_API_PATH = {
  ADD_BOOKMARK: '/api/bookmarks',
  DELETE_BOOKMARK: (id: string) => `/api/bookmarks/${id}`,
  GET_BOOKMARKS: '/api/bookmarks',
  UPDATE_BOOKMARK: (id: string) => `/api/bookmarks/${id}`,
} as const
