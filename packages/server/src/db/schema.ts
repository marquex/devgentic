export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS repos (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  url            TEXT NOT NULL UNIQUE,
  local_path     TEXT,
  status         TEXT NOT NULL DEFAULT 'pending',
  error          TEXT,
  default_branch TEXT DEFAULT 'main',
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;
