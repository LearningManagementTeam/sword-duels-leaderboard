-- Home carousel: always 4 slots in branding JSON; allow 3 MB uploads per photo
UPDATE site_content
SET body = jsonb_set(
  COALESCE(body, '{}'::jsonb),
  '{carousel_slides}',
  (
    SELECT COALESCE(jsonb_agg(elem ORDER BY ord), '[]'::jsonb)
    FROM (
      SELECT gs.ord, COALESCE(body->'carousel_slides'->gs.ord, 'null'::jsonb) AS elem
      FROM generate_series(0, 3) AS gs(ord)
    ) padded
  ),
  true
)
WHERE slug = 'branding';

UPDATE storage.buckets
SET file_size_limit = 3145728
WHERE id = 'branding';
