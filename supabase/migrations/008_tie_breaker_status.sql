-- Tie-breaker status for branches tied at the regional cut line

ALTER TYPE branch_status ADD VALUE IF NOT EXISTS 'tie_breaker';

ALTER TABLE published_standings
  ADD COLUMN IF NOT EXISTS tie_breaker_in_round INT CHECK (
    tie_breaker_in_round IS NULL OR (
      tie_breaker_in_round >= 1 AND tie_breaker_in_round <= 10
    )
  );
