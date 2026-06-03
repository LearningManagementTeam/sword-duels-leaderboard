-- Partner logo strip: always 3 slots in branding JSON
UPDATE site_content
SET body = jsonb_set(
  COALESCE(body, '{}'::jsonb),
  '{sponsor_logos}',
  (
    SELECT COALESCE(jsonb_agg(elem ORDER BY ord), '[]'::jsonb)
    FROM (
      SELECT gs.ord, COALESCE(body->'sponsor_logos'->gs.ord, 'null'::jsonb) AS elem
      FROM generate_series(0, 2) AS gs(ord)
    ) padded
  ),
  true
)
WHERE slug = 'branding';
