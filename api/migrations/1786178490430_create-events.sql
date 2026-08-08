-- Up Migration
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(255) NOT NULL,
  provider_ref VARCHAR(255) NOT NULL,
  external_ref VARCHAR(255) NOT NULL,
  status VARCHAR(255) NOT NULL,
  occured_at TIMESTAMP NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, provider_ref, external_ref)
);

-- Down Migration
DROP TABLE IF EXISTS events;
