export const BOOKMARKS = {
  DELETE: 'DELETE FROM bookmarks WHERE id = ?',
  INSERT:
    'INSERT INTO bookmarks (id, title, url) VALUES (?, ?, ?) RETURNING id, title, url',
  SELECT_ALL: 'SELECT id, title, url FROM bookmarks ORDER BY created_at DESC',
  SELECT_ID: 'SELECT id FROM bookmarks WHERE id = ?',
  UPDATE:
    'UPDATE bookmarks SET title = ?, url = ? WHERE id = ? RETURNING id, title, url',
} as const

export const KEYWORDS = {
  SELECT_ALL_WITH_BOOKMARKS: `SELECT
      k.id,
      k.name,
      COALESCE(
        json_group_array(bk.bookmark_id) FILTER (WHERE bk.bookmark_id IS NOT NULL),
        '[]'
      ) AS bookmark_ids
    FROM keywords k
    LEFT JOIN bookmarks_keywords bk ON k.id = bk.keyword_id
    GROUP BY k.id
    ORDER BY k.created_at DESC;`,
}

export const DATABASE_NAME = 'BOOKMARK_PAGE_DB'
