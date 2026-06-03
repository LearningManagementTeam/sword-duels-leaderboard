-- Per-round elimination metadata on published standings

ALTER TABLE published_standings
  ADD COLUMN IF NOT EXISTS eliminated_in_round INT CHECK (eliminated_in_round IS NULL OR (eliminated_in_round >= 1 AND eliminated_in_round <= 10)),
  ADD COLUMN IF NOT EXISTS last_active_round INT CHECK (last_active_round IS NULL OR (last_active_round >= 0 AND last_active_round <= 10));

COMMENT ON COLUMN published_standings.eliminated_in_round IS 'Round after which branch was eliminated (null if still active or phase winner)';
COMMENT ON COLUMN published_standings.last_active_round IS 'Last round this branch competed in';
