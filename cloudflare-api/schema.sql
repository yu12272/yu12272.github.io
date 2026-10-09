
CREATE TABLE IF NOT EXISTS sheets (
  id TEXT PRIMARY KEY,
  data_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sheets_updated_at
ON sheets(updated_at);
