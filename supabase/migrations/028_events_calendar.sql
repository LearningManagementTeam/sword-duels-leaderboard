-- Gamified events calendar (admin-editable, public published view)

INSERT INTO site_content (slug, body) VALUES (
  'events_calendar',
  '{"events": []}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
