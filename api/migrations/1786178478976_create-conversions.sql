-- Up Migration
CREATE TABLE IF NOT EXISTS conversions (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  provider_ref TEXT NOT NULL,
  quote_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_conversions_quote
    FOREIGN KEY (quote_id)
    REFERENCES quotes(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

-- Down Migration
DROP TABLE IF EXISTS conversions;
