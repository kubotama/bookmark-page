-- Migration number: 0002 	 2026-08-15T11:34:34.890Z
DROP TABLE IF EXISTS bookmarks_keywords;
DROP TABLE IF EXISTS keywords;

-- キーワードテーブル
CREATE TABLE keywords (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

    -- ブックマークとキーワードの中間テーブル（多対多）
CREATE TABLE bookmarks_keywords (
  id TEXT PRIMARY KEY,
  bookmark_id TEXT NOT NULL,
  keyword_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE,
  FOREIGN KEY (keyword_id) REFERENCES keywords(id) ON DELETE CASCADE,
  UNIQUE (bookmark_id, keyword_id)
);

-- 検索用インデックス
CREATE INDEX idx_bookmarks_keywords_bookmark_id ON bookmarks_keywords (bookmark_id);
CREATE INDEX idx_bookmarks_keywords_keyword_id ON bookmarks_keywords (keyword_id);
