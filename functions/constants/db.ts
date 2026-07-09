export const BOOKMARKS = {
  SELECT_ALL: 'SELECT id, title, url FROM bookmarks ORDER BY created_at DESC',
  INSERT: 'INSERT INTO bookmarks (id, title, url) VALUES (?, ?, ?) RETURNING *',
} as const
