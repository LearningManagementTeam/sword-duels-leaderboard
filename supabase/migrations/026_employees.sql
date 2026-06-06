-- Competition rep employee profiles (Rep 1 & Rep 2 per branch)

DO $$ BEGIN
  CREATE TYPE employment_status AS ENUM ('active', 'resigned', 'on_leave');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_no TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  position TEXT,
  employment_status employment_status NOT NULL DEFAULT 'active',
  resigned_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employees_employee_no ON employees (employee_no);
CREATE INDEX IF NOT EXISTS idx_employees_employment_status ON employees (employment_status);
CREATE INDEX IF NOT EXISTS idx_employees_full_name ON employees (full_name);

COMMENT ON TABLE employees IS 'Competition representative profiles keyed by employee_no';
COMMENT ON COLUMN employees.employee_no IS 'Stable identifier for manual entry and future HR sync';

ALTER TABLE branches
  ADD COLUMN IF NOT EXISTS representative_1_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS representative_2_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_branches_rep1_employee ON branches (representative_1_employee_id);
CREATE INDEX IF NOT EXISTS idx_branches_rep2_employee ON branches (representative_2_employee_id);

ALTER TABLE sd_set_scores
  ADD COLUMN IF NOT EXISTS active_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sd_set_scores_active_employee ON sd_set_scores (active_employee_id);

COMMENT ON COLUMN sd_set_scores.active_employee_id IS 'Snapshot of competing employee when scores were saved';

-- Backfill employees from existing branch rep columns
DO $$
DECLARE
  b RECORD;
  e1_id UUID;
  e2_id UUID;
  e1_no TEXT;
  e2_no TEXT;
BEGIN
  FOR b IN
    SELECT id, branch_code,
      representative_1, representative_2,
      representative_1_employee_no, representative_1_position,
      representative_2_employee_no, representative_2_position
    FROM branches
  LOOP
    e1_id := NULL;
    e2_id := NULL;

    IF COALESCE(TRIM(b.representative_1), '') <> ''
       OR COALESCE(TRIM(b.representative_1_employee_no), '') <> '' THEN
      e1_no := NULLIF(TRIM(b.representative_1_employee_no), '');
      IF e1_no IS NULL THEN
        e1_no := 'LEGACY-' || b.branch_code || '-1';
      END IF;

      INSERT INTO employees (employee_no, full_name, position, employment_status, updated_at)
      VALUES (
        e1_no,
        COALESCE(NULLIF(TRIM(b.representative_1), ''), e1_no),
        NULLIF(TRIM(b.representative_1_position), ''),
        'active',
        now()
      )
      ON CONFLICT (employee_no) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        position = COALESCE(EXCLUDED.position, employees.position),
        updated_at = now()
      RETURNING id INTO e1_id;
    END IF;

    IF COALESCE(TRIM(b.representative_2), '') <> ''
       OR COALESCE(TRIM(b.representative_2_employee_no), '') <> '' THEN
      e2_no := NULLIF(TRIM(b.representative_2_employee_no), '');
      IF e2_no IS NULL THEN
        e2_no := 'LEGACY-' || b.branch_code || '-2';
      END IF;

      INSERT INTO employees (employee_no, full_name, position, employment_status, updated_at)
      VALUES (
        e2_no,
        COALESCE(NULLIF(TRIM(b.representative_2), ''), e2_no),
        NULLIF(TRIM(b.representative_2_position), ''),
        'active',
        now()
      )
      ON CONFLICT (employee_no) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        position = COALESCE(EXCLUDED.position, employees.position),
        updated_at = now()
      RETURNING id INTO e2_id;
    END IF;

    IF e1_id IS NOT NULL OR e2_id IS NOT NULL THEN
      UPDATE branches SET
        representative_1_employee_id = e1_id,
        representative_2_employee_id = e2_id,
        representative_1 = CASE WHEN e1_id IS NOT NULL THEN
          (SELECT full_name FROM employees WHERE id = e1_id) ELSE representative_1 END,
        representative_2 = CASE WHEN e2_id IS NOT NULL THEN
          (SELECT full_name FROM employees WHERE id = e2_id) ELSE representative_2 END,
        representative_1_employee_no = CASE WHEN e1_id IS NOT NULL THEN
          (SELECT employee_no FROM employees WHERE id = e1_id) ELSE representative_1_employee_no END,
        representative_2_employee_no = CASE WHEN e2_id IS NOT NULL THEN
          (SELECT employee_no FROM employees WHERE id = e2_id) ELSE representative_2_employee_no END,
        representative_1_position = CASE WHEN e1_id IS NOT NULL THEN
          (SELECT position FROM employees WHERE id = e1_id) ELSE representative_1_position END,
        representative_2_position = CASE WHEN e2_id IS NOT NULL THEN
          (SELECT position FROM employees WHERE id = e2_id) ELSE representative_2_position END
      WHERE id = b.id;
    END IF;
  END LOOP;
END $$;

-- Snapshot active_employee_id for existing SD scores from branch rep slots
UPDATE sd_set_scores ss
SET active_employee_id = CASE
  WHEN ss.active_representative = 2 THEN b.representative_2_employee_id
  ELSE b.representative_1_employee_id
END
FROM branches b
WHERE ss.branch_id = b.id
  AND ss.active_employee_id IS NULL
  AND (
    (ss.active_representative = 2 AND b.representative_2_employee_id IS NOT NULL)
    OR (COALESCE(ss.active_representative, 1) = 1 AND b.representative_1_employee_id IS NOT NULL)
  );

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY employees_select ON employees FOR SELECT USING (true);
CREATE POLICY employees_admin ON employees FOR ALL USING (is_admin()) WITH CHECK (is_admin());
