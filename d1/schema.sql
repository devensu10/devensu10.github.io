-- D1 阅读量计数表
-- 执行：wrangler d1 execute blog-views --file=d1/schema.sql

CREATE TABLE IF NOT EXISTS views (
  slug       TEXT PRIMARY KEY,
  count      INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
