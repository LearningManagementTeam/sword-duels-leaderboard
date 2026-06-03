-- Custom page background (stored in site_content branding JSON + branding bucket)
-- Bump bucket limit so backgrounds up to 5MB are allowed (logos still validated at 2MB in app)

UPDATE storage.buckets
SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml'
  ]::text[]
WHERE id = 'branding';
