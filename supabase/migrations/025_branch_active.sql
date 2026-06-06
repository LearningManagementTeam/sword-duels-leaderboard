-- Soft roster control: deactivate branches without deleting score history

ALTER TABLE branches
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_branches_is_active ON branches (is_active);
