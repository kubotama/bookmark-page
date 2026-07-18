export const BOOKMARKS = {
  SELECT_ALL: 'SELECT id, title, url FROM bookmarks ORDER BY created_at DESC',
  SELECT_ID: 'SELECT id FROM bookmarks WHERE id = ?',
  INSERT: 'INSERT INTO bookmarks (id, title, url) VALUES (?, ?, ?) RETURNING *',
  DELETE: 'DELETE FROM bookmarks WHERE id = ?',
} as const

export const DATABASE_NAME = 'BOOKMARK_PAGE_DB'
