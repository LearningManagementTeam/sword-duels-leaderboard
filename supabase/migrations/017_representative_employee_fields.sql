-- Representative employee ID and position (LMS-ready roster metadata)

ALTER TABLE branches
  ADD COLUMN IF NOT EXISTS representative_1_employee_no TEXT,
  ADD COLUMN IF NOT EXISTS representative_1_position TEXT,
  ADD COLUMN IF NOT EXISTS representative_2_employee_no TEXT,
  ADD COLUMN IF NOT EXISTS representative_2_position TEXT;

COMMENT ON COLUMN branches.representative_1_employee_no IS 'Primary rep employee number';
COMMENT ON COLUMN branches.representative_1_position IS 'Primary rep job title or role';
COMMENT ON COLUMN branches.representative_2_employee_no IS 'Secondary rep employee number';
COMMENT ON COLUMN branches.representative_2_position IS 'Secondary rep job title or role';
