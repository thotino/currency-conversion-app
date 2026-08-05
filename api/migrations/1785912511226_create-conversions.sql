-- Up Migration
CREATE TABLE conversions (
  id text PRIMARY KEY NOT NULL,
  user_id text NOT NULL,
  provider_ref text NOT NULL,
  quote json NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Down Migration
DROP TABLE conversions;