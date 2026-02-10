CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS presets (
  creator_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  pipeline jsonb NOT NULL,
  votes int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS presets_created_at_idx ON presets (created_at DESC);
CREATE INDEX IF NOT EXISTS presets_votes_idx ON presets (votes DESC, id DESC);
CREATE INDEX IF NOT EXISTS presets_name_idx ON presets (name ASC, id ASC);
