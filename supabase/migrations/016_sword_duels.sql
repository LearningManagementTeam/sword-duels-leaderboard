-- Sword Duels — area group tournament (separate from National Competitions)

CREATE TYPE sd_set_type AS ENUM ('group_a', 'group_b', 'area_final');
CREATE TYPE sd_set_status AS ENUM ('draft', 'published');
CREATE TYPE sd_scoring_mode AS ENUM ('high_score', 'survival');

CREATE TABLE sd_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sd_area_groups (
  event_id UUID NOT NULL REFERENCES sd_events(id) ON DELETE CASCADE,
  area TEXT NOT NULL,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  group_label TEXT NOT NULL CHECK (group_label IN ('a', 'b')),
  sort_order INT NOT NULL,
  PRIMARY KEY (event_id, branch_id)
);

CREATE INDEX idx_sd_area_groups_event_area ON sd_area_groups(event_id, area);

CREATE TABLE sd_sets (
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

CREATE INDEX idx_sd_sets_event_area ON sd_sets(event_id, area);

CREATE TABLE sd_set_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES sd_sets(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  points NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (points >= 0),
  hearts_remaining INT CHECK (hearts_remaining IS NULL OR (hearts_remaining >= 0 AND hearts_remaining <= 3)),
  is_eliminated BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (set_id, branch_id)
);

CREATE INDEX idx_sd_set_scores_set ON sd_set_scores(set_id);

-- Seed default event
INSERT INTO sd_events (slug, name) VALUES ('2026', 'Sword Duels 2026');

ALTER TABLE sd_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_area_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_set_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY sd_events_select ON sd_events FOR SELECT USING (true);
CREATE POLICY sd_events_admin ON sd_events FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY sd_area_groups_select ON sd_area_groups FOR SELECT USING (true);
CREATE POLICY sd_area_groups_admin ON sd_area_groups FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY sd_sets_select ON sd_sets FOR SELECT USING (true);
CREATE POLICY sd_sets_admin ON sd_sets FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY sd_set_scores_select ON sd_set_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sd_sets s
      WHERE s.id = sd_set_scores.set_id AND s.status = 'published'
    )
  );
CREATE POLICY sd_set_scores_admin ON sd_set_scores FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());
