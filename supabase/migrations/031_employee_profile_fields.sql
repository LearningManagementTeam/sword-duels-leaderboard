-- HR employee profile fields (admin / HRIS only — not shown on public leaderboards)

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS nickname TEXT,
  ADD COLUMN IF NOT EXISTS date_hired DATE,
  ADD COLUMN IF NOT EXISTS contact_number TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

COMMENT ON COLUMN employees.nickname IS 'Preferred name / nickname for HR profile';
COMMENT ON COLUMN employees.date_hired IS 'Date hired (HR record)';
COMMENT ON COLUMN employees.contact_number IS 'Contact phone — HRIS only';
COMMENT ON COLUMN employees.email IS 'Work or personal email — HRIS only';
