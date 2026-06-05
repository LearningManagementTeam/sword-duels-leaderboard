-- Safe to re-run: finishes a partial 016 migration or verifies Sword Duels is ready.
-- Run this in Supabase SQL Editor if 016 failed with "type already exists".

-- Enums (skip if already created)
DO $$ BEGIN
  CREATE TYPE sd_set_type AS ENUM ('group_a', 'group_b', 'area_final');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sd_set_status AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sd_scoring_mode AS ENUM ('high_score', 'survival');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS sd_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sd_area_groups (
  event_id UUID NOT NULL REFERENCES sd_events(id) ON DELETE CASCADE,
  area TEXT NOT NULL,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  group_label TEXT NOT NULL CHECK (group_label IN ('a', 'b')),
  sort_order INT NOT NULL,
  PRIMARY KEY (event_id, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_sd_area_groups_event_area
  ON sd_area_groups(event_id, area);

CREATE TABLE IF NOT EXISTS sd_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES sd_events(id) ON DELETE CASCADE,
  area TEXT NOT NULL,
  set_type sd_set_type NOT NULL,
  scoring_mode sd_scoring_mode NOT NULL DEFAULT 'high_score',
  status sd_set_status NOT NULL DEFAULT 'draft',
  winner_branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, area, set_type)
);

CREATE INDEX IF NOT EXISTS idx_sd_sets_event_area ON sd_sets(event_id, area);

CREATE TABLE IF NOT EXISTS sd_set_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES sd_sets(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  points NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (points >= 0),
  hearts_remaining INT CHECK (
    hearts_remaining IS NULL
    OR (hearts_remaining >= 0 AND hearts_remaining <= 3)
  ),
  is_eliminated BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (set_id, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_sd_set_scores_set ON sd_set_scores(set_id);

INSERT INTO sd_events (slug, name)
SELECT '2026', 'Sword Duels 2026'
WHERE NOT EXISTS (SELECT 1 FROM sd_events WHERE slug = '2026');

ALTER TABLE sd_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_area_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_set_scores ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY sd_events_select ON sd_events FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY sd_events_admin ON sd_events
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY sd_area_groups_select ON sd_area_groups FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY sd_area_groups_admin ON sd_area_groups
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY sd_sets_select ON sd_sets FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY sd_sets_admin ON sd_sets
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY sd_set_scores_select ON sd_set_scores FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM sd_sets s
        WHERE s.id = sd_set_scores.set_id AND s.status = 'published'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY sd_set_scores_admin ON sd_set_scores
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Also apply 017 + 018 if not yet run (safe to re-run)
ALTER TABLE branches
  ADD COLUMN IF NOT EXISTS representative_1_employee_no TEXT,
  ADD COLUMN IF NOT EXISTS representative_1_position TEXT,
  ADD COLUMN IF NOT EXISTS representative_2_employee_no TEXT,
  ADD COLUMN IF NOT EXISTS representative_2_position TEXT;

DO $$ BEGIN
  CREATE TYPE sd_group_sort_mode AS ENUM ('branch_code', 'branch_name');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE sd_events
  ADD COLUMN IF NOT EXISTS group_sort_mode sd_group_sort_mode NOT NULL DEFAULT 'branch_code';

ALTER TABLE sd_set_scores
  ADD COLUMN IF NOT EXISTS active_representative SMALLINT NOT NULL DEFAULT 1;

DO $$ BEGIN
  ALTER TABLE sd_set_scores
    ADD CONSTRAINT sd_set_scores_active_representative_check
    CHECK (active_representative IN (1, 2));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
