-- Standalone PostgreSQL (0006): native application authentication.
--
-- Replaces Supabase Auth (auth.users, auth.sessions, auth.refresh_tokens).
-- Passwords are hashed with bcryptjs (cost 12) in application code; this
-- table stores ONLY the hash — never plaintext, never Supabase hashes.
-- Sessions are opaque random tokens (SHA-256 hash stored, cookie holds the
-- raw token); password-reset and email-verification tokens likewise.

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(320) NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_email_ck CHECK (char_length(email) BETWEEN 3 AND 320),
  CONSTRAINT users_password_hash_ck CHECK (char_length(password_hash) BETWEEN 20 AND 200)
);
-- Email login is case-insensitive (matches prior Supabase Auth behavior).
CREATE UNIQUE INDEX users_email_lower_uq ON users (lower(email));

-- Link existing profile/admin/application rows (Supabase Auth UUIDs) to
-- native users at cutover. Every FK-bearing table references UUIDs without
-- database-level FK constraints by design (identities live outside the app
-- schema); the claim flow reuses the SAME id so relationships survive.
-- This column exists only for the one-time import and is dropped in 0007
-- after verification. New native users never set it.
ALTER TABLE users ADD COLUMN legacy_auth_id UUID UNIQUE;

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT,
  CONSTRAINT user_sessions_token_hash_ck CHECK (char_length(token_hash) = 64)
);
CREATE INDEX user_sessions_user_idx ON user_sessions (user_id);
CREATE INDEX user_sessions_expires_idx ON user_sessions (expires_at);

-- Single-use tokens for email verification and password reset.
CREATE TABLE user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  purpose VARCHAR(20) NOT NULL
    CHECK (purpose IN ('verify_email', 'password_reset')),
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  CONSTRAINT user_tokens_hash_ck CHECK (char_length(token_hash) = 64)
);
CREATE INDEX user_tokens_user_idx ON user_tokens (user_id);

-- Reuse RLS-removal idempotency: nothing Supabase-specific here, plain tables.

-- Sessions older than the maximum lifetime are dead rows; the login path
-- deletes expired rows for the user on every successful authentication.
