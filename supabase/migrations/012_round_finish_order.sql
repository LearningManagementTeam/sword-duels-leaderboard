-- Qualification finish order for race-to-correct rounds (e.g. June R3).
ALTER TABLE round_results
  ADD COLUMN IF NOT EXISTS finish_order INT CHECK (
    finish_order IS NULL OR (finish_order >= 1 AND finish_order <= 32)
  );

ALTER TABLE published_standings
  ADD COLUMN IF NOT EXISTS round3_finish_order INT CHECK (
    round3_finish_order IS NULL OR (round3_finish_order >= 1 AND round3_finish_order <= 32)
  );

COMMENT ON COLUMN round_results.finish_order IS '1 = first to qualify; used for race-to-correct rounds';
COMMENT ON COLUMN published_standings.round3_finish_order IS 'Copied from round 3 finish_order at publish time';
