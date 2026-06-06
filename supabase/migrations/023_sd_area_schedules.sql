-- Per-area Sword Duels battle schedule (Group A / B / area final)

INSERT INTO site_content (slug, body) VALUES (
  'sd_area_schedules',
  '{"byArea": {}, "nationals": {}}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
