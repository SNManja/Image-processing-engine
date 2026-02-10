CREATE TABLE IF NOT EXISTS user_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  provider text NOT NULL CHECK (provider IN ('google', 'github')),
  provider_user_id text NOT NULL,

  email varchar(255) NOT NULL,             
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT user_identities_provider_uid_unique
    UNIQUE (provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS user_identities_user_id_idx
  ON user_identities (user_id);
