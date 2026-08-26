import {
  Bookmark,
  BookmarkWithKeywords,
  CreateBookmarkSchema,
} from '../schemas/bookmark'
import { KeywordWithBookmarkIds } from '../schemas/keyword'

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
  CONSTRAINT_BKRELATION_ERROR: 'UNIQUE constraint failed: bookmarks_keywords',
  CONSTRAINT_BOOKMARK_ERROR: 'UNIQUE constraint failed: bookmarks.url',
  CONSTRAINT_KEYWORD_ERROR: 'UNIQUE constraint failed: keywords.name',
  DB_ERROR: 'データベースにエラーが発生しました',
  NETWORK_ERROR: 'ネットワークにエラーが発生しました',
  SAVE_ERROR: '保存できませんでした',
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
  ADD_KEYWORD: '/api/keywords',
  DELETE_BOOKMARK: (id: string) => `/api/bookmarks/${id}`,
  GET_BOOKMARKS: '/api/bookmarks',
  GET_KEYWORDS: '/api/keywords',
  UPDATE_BOOKMARK: (id: string) => `/api/bookmarks/${id}`,
} as const

export const TestKeywordsTableData = [
  {
    bookmark_ids: '["018ed000-0001-7000-8000-000000000001"]',
    id: '018ed000-0001-7000-8000-000000000001',
    name: 'キーワード1',
  },
  {
    bookmark_ids: '[]',
    id: '018ed000-0001-7000-8000-000000000002',
    name: 'キーワード2',
  },
] as const

export const TestKeywords: KeywordWithBookmarkIds[] = [
  {
    bookmark_ids: ['018ed000-0001-7000-8000-000000000001'],
    id: '018ed000-0001-7000-8000-000000000001',
    name: 'キーワード1',
  },
  {
    bookmark_ids: [],
    id: '018ed000-0001-7000-8000-000000000002',
    name: 'キーワード2',
  },
] as const

export const mockKeywordsData = {
  data: TestKeywords,
  success: true,
}

export const TestBookmarkWKWTableData = [
  {
    id: '018ed000-0001-7000-8000-000000000001',
    keywords:
      '[{ "id": "018ed000-0001-7000-8000-000000000001", "name": "キーワード1" }]',
    title: 'Hono',
    url: 'https://hono.dev/',
  },
  {
    id: '018ed000-0001-7000-8000-000000000002',
    keywords: '[]',
    title: 'Vite',
    url: 'https://vitejs.dev/',
  },
  {
    id: '018ed000-0001-7000-8000-000000000003',
    keywords: '[]',
    title: 'Google マップ',
    url: 'https://www.google.com/maps',
  },
]

export const TestBookmarkWithKeywords: BookmarkWithKeywords[] = [
  {
    id: '018ed000-0001-7000-8000-000000000001',
    keywords: [
      { id: '018ed000-0001-7000-8000-000000000001', name: 'キーワード1' },
    ],
    title: 'Hono',
    url: 'https://hono.dev/',
  },
  {
    id: '018ed000-0001-7000-8000-000000000002',
    keywords: [],
    title: 'Vite',
    url: 'https://vitejs.dev/',
  },
  {
    id: '018ed000-0001-7000-8000-000000000003',
    keywords: [],
    title: 'Google マップ',
    url: 'https://www.google.com/maps',
  },
]

export const mockTestBookmarkWithKeywords = {
  data: TestBookmarkWithKeywords,
  success: true,
}

export const TestUuid = '018ed000-0001-7000-8000-000000000088'
