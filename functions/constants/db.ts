export const BOOKMARKS = {
  DELETE: 'DELETE FROM bookmarks WHERE id = ?',
  INSERT:
    'INSERT INTO bookmarks (id, title, url) VALUES (?, ?, ?) RETURNING id, title, url',
  SELECT_ALL_WITH_KEYWORDS: `SELECT
      b.id,
      b.title,
      b.url,
      b.created_at,
      COALESCE(
        json_group_array(
          json_object('id', k.id, 'name', k.name)
        ) FILTER (WHERE k.id IS NOT NULL),
        '[]'
      ) AS keywords
    FROM bookmarks b
    LEFT JOIN bookmarks_keywords bk ON b.id = bk.bookmark_id
    LEFT JOIN keywords k ON bk.keyword_id = k.id
    GROUP BY b.id
    ORDER BY b.created_at DESC;`,
  SELECT_ID: 'SELECT id FROM bookmarks WHERE id = ?',
  UPDATE:
    'UPDATE bookmarks SET title = ?, url = ? WHERE id = ? RETURNING id, title, url',
} as const

export const KEYWORDS = {
  INSERT: 'INSERT INTO keywords (id, name) VALUES (?, ?) RETURNING id, name',
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
  UPDATE: 'UPDATE keywords SET name = ? WHERE id = ? RETURNING id, name',
} as const

export const BOOKMARKS_KEYWORDS = {
  INSERT:
    'INSERT INTO bookmarks_keywords (id, bookmark_id, keyword_id) VALUES (?, ?, ?) RETURNING id, bookmark_id, keyword_id',
} as const

export const DATABASE_NAME = 'BOOKMARK_PAGE_DB'
