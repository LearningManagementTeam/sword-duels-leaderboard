-- Sword Duels dual tournament format: classic V1 vs regional-average V2

DO $$ BEGIN
  CREATE TYPE sd_tournament_format AS ENUM ('classic_v1', 'regional_average_v2');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE sd_events
  ADD COLUMN IF NOT EXISTS tournament_format sd_tournament_format NOT NULL DEFAULT 'classic_v1';

COMMENT ON COLUMN sd_events.tournament_format IS
  'classic_v1: area finals → wildcard → 16-slot knockout. regional_average_v2: area finals → 3 regional rounds (avg) → 3-way finals.';

ALTER TYPE sd_set_type ADD VALUE IF NOT EXISTS 'regional_r1';
ALTER TYPE sd_set_type ADD VALUE IF NOT EXISTS 'regional_r2';
ALTER TYPE sd_set_type ADD VALUE IF NOT EXISTS 'regional_r3';
