-- Sword Duels: flexible group sorting + per-set active representative

CREATE TYPE sd_group_sort_mode AS ENUM ('branch_code', 'branch_name');

ALTER TABLE sd_events
  ADD COLUMN IF NOT EXISTS group_sort_mode sd_group_sort_mode NOT NULL DEFAULT 'branch_code';

ALTER TABLE sd_set_scores
  ADD COLUMN IF NOT EXISTS active_representative SMALLINT NOT NULL DEFAULT 1
    CHECK (active_representative IN (1, 2));

COMMENT ON COLUMN sd_events.group_sort_mode IS 'How branches are ordered before splitting into Group A / B';
COMMENT ON COLUMN sd_set_scores.active_representative IS 'Which rep (1 or 2) competed for this branch in this set';
