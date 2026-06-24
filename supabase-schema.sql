-- ═══════════════════════════════════════════════════════
--  RASF Platform — Supabase Schema
--  Run this once on a fresh database.
--  For migrations, use the separate migration files.
-- ═══════════════════════════════════════════════════════

-- ── Portfolio data ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS portfolio_settings (
  id             TEXT PRIMARY KEY DEFAULT 'main',
  currency       TEXT    DEFAULT 'SAR',
  quarter_growth NUMERIC DEFAULT 0,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id         TEXT         PRIMARY KEY,
  data       JSONB        NOT NULL,
  status     TEXT         DEFAULT 'portfolio',  -- 'portfolio' | 'pipeline'
  sort_order INTEGER      DEFAULT 0,
  created_at TIMESTAMPTZ  DEFAULT NOW(),
  updated_at TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Users ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
  id         UUID    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT    NOT NULL,
  email      TEXT    NOT NULL,
  role       TEXT    NOT NULL DEFAULT 'user',  -- 'admin' | 'dep_admin' | 'user'
  sectors    TEXT[]  DEFAULT '{}',             -- ['dev','commercial','finance','operations','corporate']
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Helper functions ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION is_dep_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'dep_admin')
      AND is_active = true
  );
$$;

-- ── RLS ───────────────────────────────────────────────────────────────

ALTER TABLE portfolio_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects           ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles      ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "users read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id OR is_admin());

CREATE POLICY "admins manage profiles"
  ON user_profiles FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- ── Notes ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS project_notes (
  id                     BIGSERIAL    PRIMARY KEY,
  project_id             TEXT         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  text                   TEXT         NOT NULL,
  added_by               TEXT         NOT NULL,
  user_id                UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_from_portfolio BOOLEAN      DEFAULT false,
  created_at             TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE project_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dep users read notes"
  ON project_notes FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_active = true));

CREATE POLICY "dep users insert notes"
  ON project_notes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_active = true));

CREATE POLICY "users update own notes"
  ON project_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "dep admins update any note"
  ON project_notes FOR UPDATE
  USING (is_dep_admin());

CREATE POLICY "admins delete notes"
  ON project_notes FOR DELETE
  USING (is_admin());

-- ── Files ─────────────────────────────────────────────────────────────
-- Requires a private Supabase Storage bucket named: project-files

CREATE TABLE IF NOT EXISTS project_files (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    TEXT         REFERENCES projects(id) ON DELETE CASCADE,
  project_name  TEXT         NOT NULL DEFAULT '',
  name          TEXT         NOT NULL,
  category      TEXT         NOT NULL,  -- 'fin' | 'rep' | 'con' | 'drw'
  size_mb       NUMERIC      NOT NULL,
  storage_path  TEXT         NOT NULL UNIQUE,
  uploaded_by   TEXT         NOT NULL,
  user_id       UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS file_audit_log (
  id            BIGSERIAL    PRIMARY KEY,
  file_id       UUID         NOT NULL REFERENCES project_files(id) ON DELETE CASCADE,
  action        TEXT         NOT NULL,  -- 'upload' | 'view' | 'download' | 'delete'
  performed_by  TEXT         NOT NULL,
  user_id       UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE project_files  ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dep users read files"
  ON project_files FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_active = true));

CREATE POLICY "dep users insert files"
  ON project_files FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_active = true));

CREATE POLICY "dep admins delete files"
  ON project_files FOR DELETE
  USING (is_dep_admin());

CREATE POLICY "dep users read audit"
  ON file_audit_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_active = true));

CREATE POLICY "dep users insert audit"
  ON file_audit_log FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_active = true));

-- Storage bucket RLS (run after creating the 'project-files' private bucket):
--
-- CREATE POLICY "auth users upload files"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'project-files' AND auth.role() = 'authenticated');
--
-- CREATE POLICY "auth users read files"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'project-files' AND auth.role() = 'authenticated');
--
-- CREATE POLICY "dep admins delete storage files"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'project-files' AND is_dep_admin());

-- ── First admin ───────────────────────────────────────────────────────
-- Run AFTER creating the admin user in Auth dashboard.
--
-- INSERT INTO user_profiles (id, full_name, email, role, sectors)
-- SELECT id, 'Your Name', 'your@email.com', 'admin',
--        ARRAY['dev','commercial','finance','operations','corporate']
-- FROM auth.users WHERE email = 'your@email.com';
