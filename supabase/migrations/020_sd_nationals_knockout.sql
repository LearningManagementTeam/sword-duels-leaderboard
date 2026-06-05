-- Sword Duels — Nationals knockout bracket (area vs area → champion)

DO $$ BEGIN
  CREATE TYPE sd_knockout_round AS ENUM ('r16', 'qf', 'sf', 'final');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sd_knockout_bracket_status AS ENUM ('pending', 'active', 'complete');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS sd_knockout_brackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES sd_events(id) ON DELETE CASCADE,
  status sd_knockout_bracket_status NOT NULL DEFAULT 'pending',
  champion_branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id)
);

CREATE TABLE IF NOT EXISTS sd_knockout_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES sd_events(id) ON DELETE CASCADE,
  round sd_knockout_round NOT NULL,
  match_index INT NOT NULL CHECK (match_index >= 0),
  entrant_a_branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  entrant_b_branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  winner_branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  status sd_set_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, round, match_index)
);

CREATE TABLE IF NOT EXISTS sd_knockout_match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES sd_knockout_matches(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  points NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (points >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (match_id, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_sd_knockout_matches_event
  ON sd_knockout_matches(event_id, round);

CREATE INDEX IF NOT EXISTS idx_sd_knockout_match_scores_match
  ON sd_knockout_match_scores(match_id);

ALTER TABLE sd_knockout_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_knockout_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_knockout_match_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sd_knockout_brackets_select ON sd_knockout_brackets;
CREATE POLICY sd_knockout_brackets_select ON sd_knockout_brackets
  FOR SELECT USING (true);

DROP POLICY IF EXISTS sd_knockout_brackets_admin ON sd_knockout_brackets;
CREATE POLICY sd_knockout_brackets_admin ON sd_knockout_brackets
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS sd_knockout_matches_select ON sd_knockout_matches;
CREATE POLICY sd_knockout_matches_select ON sd_knockout_matches
  FOR SELECT USING (true);

DROP POLICY IF EXISTS sd_knockout_matches_admin ON sd_knockout_matches;
CREATE POLICY sd_knockout_matches_admin ON sd_knockout_matches
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS sd_knockout_match_scores_select ON sd_knockout_match_scores;
CREATE POLICY sd_knockout_match_scores_select ON sd_knockout_match_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sd_knockout_matches m
      WHERE m.id = sd_knockout_match_scores.match_id
        AND m.status = 'published'
    )
  );

DROP POLICY IF EXISTS sd_knockout_match_scores_admin ON sd_knockout_match_scores;
CREATE POLICY sd_knockout_match_scores_admin ON sd_knockout_match_scores
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
