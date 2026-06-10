-- Areas where Group A / B were hand-picked (sync from branches skips these).

ALTER TABLE sd_events
  ADD COLUMN IF NOT EXISTS manual_area_groups JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN sd_events.manual_area_groups IS
  'JSON array of area names with operator-assigned Group A/B (not auto-split on sync).';
