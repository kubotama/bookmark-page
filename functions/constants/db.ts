export const BOOKMARKS = {
  DELETE: 'DELETE FROM bookmarks WHERE id = ?',
  INSERT:
    'INSERT INTO bookmarks (id, title, url) VALUES (?, ?, ?) RETURNING id, title, url',
  SELECT_ALL: 'SELECT id, title, url FROM bookmarks ORDER BY created_at DESC',
  SELECT_ID: 'SELECT id FROM bookmarks WHERE id = ?',
  UPDATE:
    'UPDATE bookmarks SET title = ?, url = ? WHERE id = ? RETURNING id, title, url',
} as const

export const DATABASE_NAME = 'BOOKMARK_PAGE_DB'
