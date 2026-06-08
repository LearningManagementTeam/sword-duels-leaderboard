-- Employee profile photos for HRIS and competition displays

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS photo_path TEXT;

COMMENT ON COLUMN employees.photo_path IS 'Storage object path in employee-photos bucket';

ALTER TABLE sd_set_scores
  ADD COLUMN IF NOT EXISTS active_employee_photo_path TEXT;

COMMENT ON COLUMN sd_set_scores.active_employee_photo_path IS 'Snapshot of rep photo when scores were saved';

-- Backfill photo snapshot from current employee profile where missing
UPDATE sd_set_scores s
SET active_employee_photo_path = e.photo_path
FROM employees e
WHERE s.active_employee_id = e.id
  AND s.active_employee_photo_path IS NULL
  AND e.photo_path IS NOT NULL;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-photos',
  'employee-photos',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY employee_photos_storage_public_read ON storage.objects
  FOR SELECT USING (bucket_id = 'employee-photos');

CREATE POLICY employee_photos_storage_admin_write ON storage.objects
  FOR ALL USING (bucket_id = 'employee-photos' AND is_admin())
  WITH CHECK (bucket_id = 'employee-photos' AND is_admin());
