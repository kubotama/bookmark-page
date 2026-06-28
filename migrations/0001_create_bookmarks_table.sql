-- Migration number: 0001 	 2026-06-28T00:39:56.666Z
-- Migration number: 0001 	 2026-06-28T00:25:58.200Z
-- migrations/0001_create_bookmarks_table.sql
DROP TABLE IF EXISTS bookmarks;
CREATE TABLE bookmarks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE INDEX idx_bookmarks_created_at ON bookmarks (created_at DESC);

-- MVP確認用に初期データを1件入れておく
INSERT INTO bookmarks (id, title, url) VALUES ('018ed000-0001-7000-8000-000000000001', 'Hono', 'https://hono.dev/');
INSERT INTO bookmarks (id, title, url) VALUES ('018ed000-0001-7000-8000-000000000002', 'Vite', 'https://vite.dev');
