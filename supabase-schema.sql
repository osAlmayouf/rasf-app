-- ═══════════════════════════════════════════════════════
--  RASF Platform — Supabase Schema
--  Run this once in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════

-- ── Portfolio data ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS portfolio_settings (
  id             TEXT PRIMARY KEY DEFAULT 'main',
  currency       TEXT    DEFAULT 'SAR',
  quarter_growth NUMERIC DEFAULT 0,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id         TEXT PRIMARY KEY,
  data       JSONB        NOT NULL,
  sort_order INTEGER      DEFAULT 0,
  created_at TIMESTAMPTZ  DEFAULT NOW(),
  updated_at TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Users ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
  id         UUID    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT    NOT NULL,
  email      TEXT    NOT NULL,
  role       TEXT    NOT NULL DEFAULT 'user',   -- 'admin' | 'user'
  sectors    TEXT[]  DEFAULT '{}',              -- ['dev','commercial','finance','operations','corporate']
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Helper: check if the calling user is admin (avoids RLS recursion) ─

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$;

-- ── RLS ───────────────────────────────────────────────────────────────

ALTER TABLE portfolio_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects           ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles      ENABLE ROW LEVEL SECURITY;

-- Portfolio: any authenticated user can read; only admins write
CREATE POLICY "auth users read portfolio_settings"
  ON portfolio_settings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "admins write portfolio_settings"
  ON portfolio_settings FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "auth users read projects"
  ON projects FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "admins write projects"
  ON projects FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- User profiles: user sees own row; admin sees + writes all
CREATE POLICY "users read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id OR is_admin());

CREATE POLICY "admins manage profiles"
  ON user_profiles FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- ── First admin (run AFTER creating the admin user in Auth dashboard) ─
-- Replace the email below with your own, then run this block.
--
-- INSERT INTO user_profiles (id, full_name, email, role, sectors)
-- SELECT id, 'عمر المعيوف', 'o.almayouf@rasf.sa', 'admin',
--        ARRAY['dev','commercial','finance','operations','corporate']
-- FROM auth.users WHERE email = 'o.almayouf@rasf.sa';
