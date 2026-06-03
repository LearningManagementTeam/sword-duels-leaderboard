-- Admin-selected extra advancers after automatic regional cut

CREATE TABLE manual_round_advances (
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  round_number INT NOT NULL CHECK (round_number >= 1 AND round_number <= 10),
  region region_type NOT NULL,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_email TEXT,
  PRIMARY KEY (season_id, round_number, region, branch_id)
);

CREATE INDEX idx_manual_round_advances_season_round
  ON manual_round_advances(season_id, round_number);

ALTER TABLE manual_round_advances ENABLE ROW LEVEL SECURITY;

CREATE POLICY manual_round_advances_select ON manual_round_advances
  FOR SELECT USING (true);

CREATE POLICY manual_round_advances_admin ON manual_round_advances
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
