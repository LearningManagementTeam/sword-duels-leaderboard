-- Sword Duels — Nationals wildcard round (slot 16 after area reps)

DO $$ BEGIN
  CREATE TYPE sd_wildcard_status AS ENUM (
    'pending',
    'auto_resolved',
    'tiebreak_draft',
    'tiebreak_published'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS sd_wildcard_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES sd_events(id) ON DELETE CASCADE,
  status sd_wildcard_status NOT NULL DEFAULT 'pending',
  tied_score NUMERIC(12, 2),
  winner_branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id)
);

CREATE TABLE IF NOT EXISTS sd_wildcard_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wildcard_round_id UUID NOT NULL REFERENCES sd_wildcard_rounds(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  area TEXT NOT NULL,
  area_final_score NUMERIC(12, 2) NOT NULL DEFAULT 0,
  points NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (points >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (wildcard_round_id, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_sd_wildcard_scores_round
  ON sd_wildcard_scores(wildcard_round_id);

ALTER TABLE sd_wildcard_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_wildcard_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sd_wildcard_rounds_select ON sd_wildcard_rounds;
CREATE POLICY sd_wildcard_rounds_select ON sd_wildcard_rounds
  FOR SELECT USING (true);

DROP POLICY IF EXISTS sd_wildcard_rounds_admin ON sd_wildcard_rounds;
CREATE POLICY sd_wildcard_rounds_admin ON sd_wildcard_rounds
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS sd_wildcard_scores_select ON sd_wildcard_scores;
CREATE POLICY sd_wildcard_scores_select ON sd_wildcard_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sd_wildcard_rounds r
      WHERE r.id = sd_wildcard_scores.wildcard_round_id
        AND r.status IN ('auto_resolved', 'tiebreak_published')
    )
  );

DROP POLICY IF EXISTS sd_wildcard_scores_admin ON sd_wildcard_scores;
CREATE POLICY sd_wildcard_scores_admin ON sd_wildcard_scores
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
