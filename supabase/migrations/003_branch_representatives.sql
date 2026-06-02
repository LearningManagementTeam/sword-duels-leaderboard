-- Branch representatives (enter before competition starts)

ALTER TABLE branches
  ADD COLUMN IF NOT EXISTS representative_1 TEXT,
  ADD COLUMN IF NOT EXISTS representative_2 TEXT,
  ADD COLUMN IF NOT EXISTS representatives_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN branches.representative_1 IS 'Primary branch representative name';
COMMENT ON COLUMN branches.representative_2 IS 'Secondary representative name (optional)';
