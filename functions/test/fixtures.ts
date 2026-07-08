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

export const BookmarksTableData = {
  id: '7488a6de-412d-4076-905e-8848d79cb6ee',
  title: 'Vite 公式サイト',
  url: 'https://vite.dev',
  created_at: '2026-06-28 11:30:00',
} as const

export const INVALID_STRING = {
  URL: 'not-a-valid-url',
} as const

export const TEST_ERROR_MESSAGE = {
  NETWORK_ERROR: 'ネットワークエラー',
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
