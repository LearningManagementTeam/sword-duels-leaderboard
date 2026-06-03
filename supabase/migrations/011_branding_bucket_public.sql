-- Ensure branding bucket stays publicly readable (carousel + logo on home page)
UPDATE storage.buckets
SET public = true
WHERE id = 'branding';
