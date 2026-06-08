-- HR home/work branch for employees (separate from competition rep assignment)

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS home_branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_home_branch ON employees (home_branch_id);

COMMENT ON COLUMN employees.home_branch_id IS
  'HR home/work branch — not the same as competition rep assignment on branches';
