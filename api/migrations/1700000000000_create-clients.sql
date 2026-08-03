-- Up Migration
CREATE TABLE clients (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO clients (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Acme Corp');

-- Down Migration
DROP TABLE clients;
