
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now()
);


CREATE UNIQUE INDEX users_username_lower_unique
ON users (lower(username))
WHERE username IS NOT NULL;
