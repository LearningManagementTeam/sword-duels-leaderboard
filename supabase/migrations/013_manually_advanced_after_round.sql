-- Persist committee manual advancement picks on published standings for public badges.

ALTER TABLE published_standings
  ADD COLUMN IF NOT EXISTS manually_advanced_after_round INT CHECK (
    manually_advanced_after_round IS NULL OR (
      manually_advanced_after_round >= 1 AND manually_advanced_after_round <= 10
    )
  );

COMMENT ON COLUMN published_standings.manually_advanced_after_round IS
  'Round after which this branch was manually added via committee pick';
