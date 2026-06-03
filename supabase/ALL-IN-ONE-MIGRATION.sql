-- ============================================================
-- Sword Duels Leaderboard — run this ONCE in Supabase SQL Editor
-- Dashboard → SQL → New query → Paste all → Run
-- ============================================================

-- From 001_initial_schema.sql

CREATE TYPE region_type AS ENUM ('luzon', 'ncr', 'vismin');
CREATE TYPE season_slug AS ENUM ('june_area', 'july_region', 'august_finals');
CREATE TYPE round_status AS ENUM ('draft', 'published');
CREATE TYPE branch_status AS ENUM (
  'active',
  'advanced',
  'eliminated',
  'regional_finalist',
  'champion'
);

CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_code TEXT NOT NULL UNIQUE,
  branch_name TEXT NOT NULL,
  area TEXT NOT NULL,
  region region_type NOT NULL,
  representative_1 TEXT,
  representative_2 TEXT,
  representatives_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug season_slug NOT NULL UNIQUE,
  name TEXT NOT NULL,
  advancement_count INT,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  round_number INT NOT NULL CHECK (round_number >= 1 AND round_number <= 10),
  name TEXT NOT NULL,
  status round_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (season_id, round_number)
);

CREATE TABLE round_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  points NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (points >= 0),
  wins INT NOT NULL DEFAULT 0 CHECK (wins >= 0),
  losses INT NOT NULL DEFAULT 0 CHECK (losses >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (round_id, branch_id)
);

CREATE TABLE season_participants (
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  seeded_from_season_id UUID REFERENCES seasons(id),
  PRIMARY KEY (season_id, branch_id)
);

CREATE TABLE published_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  rank INT NOT NULL,
  total_points NUMERIC(12, 2) NOT NULL DEFAULT 0,
  round1_points NUMERIC(12, 2) NOT NULL DEFAULT 0,
  round2_points NUMERIC(12, 2) NOT NULL DEFAULT 0,
  round3_points NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_wins INT NOT NULL DEFAULT 0,
  status branch_status NOT NULL DEFAULT 'active',
  region_filter region_type,
  eliminated_in_round INT CHECK (eliminated_in_round IS NULL OR (eliminated_in_round >= 1 AND eliminated_in_round <= 10)),
  last_active_round INT CHECK (last_active_round IS NULL OR (last_active_round >= 0 AND last_active_round <= 10)),
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (season_id, branch_id, region_filter)
);

CREATE TABLE manual_round_advances (
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  round_number INT NOT NULL CHECK (round_number >= 1 AND round_number <= 10),
  region region_type NOT NULL,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_email TEXT,
  PRIMARY KEY (season_id, round_number, region, branch_id)
);

CREATE TABLE phase_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE UNIQUE,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_by_email TEXT
);

CREATE TABLE admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_branches_area ON branches(area);
CREATE INDEX idx_branches_region ON branches(region);
CREATE INDEX idx_round_results_round ON round_results(round_id);
CREATE INDEX idx_round_results_branch ON round_results(branch_id);
CREATE INDEX idx_published_standings_season ON published_standings(season_id);
CREATE INDEX idx_manual_round_advances_season_round
  ON manual_round_advances(season_id, round_number);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

INSERT INTO seasons (slug, name, advancement_count, sort_order) VALUES
  ('june_area', 'June — Area-wide', 24, 1),
  ('july_region', 'July — Region-wide', 3, 2),
  ('august_finals', 'August — Finals', 1, 3);

INSERT INTO rounds (season_id, round_number, name)
SELECT s.id, n.num, 'Round ' || n.num
FROM seasons s
CROSS JOIN (SELECT generate_series(1, 3) AS num) n;

CREATE OR REPLACE VIEW public_leaderboard_meta AS
SELECT
  s.slug AS season_slug,
  MAX(ps.published_at) AS last_published_at
FROM seasons s
LEFT JOIN published_standings ps ON ps.season_id = s.id
GROUP BY s.id, s.slug;

-- From 002_rls_policies.sql

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_round_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  );
$$;

CREATE POLICY branches_select ON branches FOR SELECT USING (true);
CREATE POLICY branches_admin ON branches FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY seasons_select ON seasons FOR SELECT USING (true);
CREATE POLICY seasons_admin ON seasons FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY rounds_select ON rounds FOR SELECT USING (true);
CREATE POLICY rounds_admin ON rounds FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY round_results_select ON round_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rounds r
      WHERE r.id = round_results.round_id AND r.status = 'published'
    )
  );
CREATE POLICY round_results_admin ON round_results FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY published_standings_select ON published_standings FOR SELECT USING (true);
CREATE POLICY published_standings_admin ON published_standings FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY manual_round_advances_select ON manual_round_advances FOR SELECT USING (true);
CREATE POLICY manual_round_advances_admin ON manual_round_advances FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY season_participants_select ON season_participants FOR SELECT USING (true);
CREATE POLICY season_participants_admin ON season_participants FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY phase_locks_select ON phase_locks FOR SELECT USING (true);
CREATE POLICY phase_locks_admin ON phase_locks FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admins_select ON admins FOR SELECT USING (is_admin());
CREATE POLICY admins_admin ON admins FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY audit_select ON audit_log FOR SELECT USING (is_admin());
CREATE POLICY audit_insert ON audit_log FOR INSERT WITH CHECK (is_admin());

-- 006: Editable site content
CREATE TABLE site_content (
  slug TEXT PRIMARY KEY,
  body JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by_email TEXT
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY site_content_select ON site_content FOR SELECT USING (true);
CREATE POLICY site_content_admin ON site_content FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

INSERT INTO site_content (slug, body) VALUES (
  'mechanics_public',
  '{"intro":"Welcome to Sword Duels 2026. Standings update after each published round. Rules below are kept in sync with the competition system.","announcements":"","custom_sections":[]}'::jsonb
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO site_content (slug, body) VALUES (
  'branding',
  '{"logo_url":null,"logo_alt":"Sword Duels"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'branding',
  'branding',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY branding_storage_public_read ON storage.objects
  FOR SELECT USING (bucket_id = 'branding');

CREATE POLICY branding_storage_admin_write ON storage.objects
  FOR ALL USING (bucket_id = 'branding' AND is_admin())
  WITH CHECK (bucket_id = 'branding' AND is_admin());

-- 008: Tie-breaker status
ALTER TYPE branch_status ADD VALUE IF NOT EXISTS 'tie_breaker';

ALTER TABLE published_standings
  ADD COLUMN IF NOT EXISTS tie_breaker_in_round INT CHECK (
    tie_breaker_in_round IS NULL OR (
      tie_breaker_in_round >= 1 AND tie_breaker_in_round <= 10
    )
  );

-- Branding bucket: 5MB for logo + home carousel photos (custom page backgrounds retired)
UPDATE storage.buckets
SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml'
  ]::text[]
WHERE id = 'branding';

-- Ensure branding photos are publicly viewable (required for home carousel)
UPDATE storage.buckets
SET public = true
WHERE id = 'branding';

-- 010: Competition map (home page progress)
INSERT INTO site_content (slug, body) VALUES (
  'competition_map',
  '{
    "milestoneId": "june_r1",
    "regionHighlight": "all",
    "publicCaption": "Competition is underway — June Round 1 across all regions.",
    "showContestantList": true
  }'::jsonb
) ON CONFLICT (slug) DO NOTHING;
