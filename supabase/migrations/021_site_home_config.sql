-- Admin-controlled featured program on the public home page

INSERT INTO site_content (slug, body) VALUES (
  'site_home',
  '{
    "featuredProgram": "sword_duels",
    "heroHeadlineOverride": "",
    "heroSublineOverride": ""
  }'::jsonb
) ON CONFLICT (slug) DO NOTHING;
