-- ══════════════════════════════════════════════════════════════
-- NUR — Islamic Script Generator · Supabase Schema
-- Run this entire file once in Supabase → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── USERS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  credits       INTEGER NOT NULL DEFAULT 0,
  plan          TEXT    NOT NULL DEFAULT 'free',  -- free | basic | standard | pro
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ── SCRIPTS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scripts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic          TEXT        NOT NULL,
  category       TEXT        NOT NULL,
  tone           TEXT,
  duration       TEXT,
  output_type    TEXT,
  language       TEXT        DEFAULT 'english',
  youtube_title  TEXT,
  result_json    JSONB       NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scripts_user    ON scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_scripts_created ON scripts(created_at DESC);

-- ── auto-update updated_at on users ────────────────────────────
CREATE OR REPLACE FUNCTION _set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

-- ── Row Level Security ──────────────────────────────────────────
-- FastAPI uses service_role key which bypasses RLS.
-- Enable RLS to block any direct anon/authenticated client access.
ALTER TABLE users   ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;

-- Drop old policies if re-running
DROP POLICY IF EXISTS "block_direct_users"   ON users;
DROP POLICY IF EXISTS "block_direct_scripts" ON scripts;

CREATE POLICY "block_direct_users"   ON users   FOR ALL USING (false);
CREATE POLICY "block_direct_scripts" ON scripts FOR ALL USING (false);
