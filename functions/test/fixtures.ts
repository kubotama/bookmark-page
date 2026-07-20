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
  success: true,
  data: TestBookmarks,
}

export const BookmarksTableData = {
  id: '7488a6de-412d-4076-905e-8848d79cb6ee',
  title: 'Vite 公式サイト',
  url: 'https://vite.dev',
  created_at: '2026-06-28 11:30:00',
} as const

export const INVALID_STRING = {
  URL: 'not-a-valid-url',
  ID: 'not-found-id',
} as const

export const TEST_ERROR_MESSAGE = {
  API_ERROR: 'APIへのアクセスにエラーが発生しました',
  NETWORK_ERROR: 'ネットワークにエラーが発生しました',
  DB_ERROR: 'データベースにエラーが発生しました',
} as const

export const TEST_API_URL = {
  LOCAL: 'http://localhost:54321',
} as const

export const getExpectedText = (
  schema: typeof CreateBookmarkSchema,
  body: { url: string; title: string },
  name: string,
) => {
  const schemaResult = schema.safeParse(body)

  // safeParse が失敗したときの中身から、title に関するエラーメッセージを抽出
  return schemaResult.success
    ? ''
    : schemaResult.error.issues.find((issue) => issue.path[0] === name)?.message
}

export const REQUEST_API_PATH = {
  GET_BOOKMARKS: '/api/bookmarks',
  DELETE_BOOKMARK: (id: string) => `/api/bookmarks/${id}`,
  UPDATE_BOOKMARK: (id: string) => `/api/bookmarks/${id}`,
} as const
