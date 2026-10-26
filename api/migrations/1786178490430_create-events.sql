-- Up Migration
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(255) NOT NULL,
  provider_ref VARCHAR(255) NOT NULL,
  event_processing_status VARCHAR(255) NOT NULL,
  event_occurred_at TIMESTAMPTZ NOT NULL,
  event_payload JSON NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS events_processing_status_occurred_at_idx ON events(event_processing_status, event_occurred_at);

-- Down Migration
DROP INDEX IF EXISTS events_processing_status_occurred_at_idx;
DROP TABLE IF EXISTS events;
