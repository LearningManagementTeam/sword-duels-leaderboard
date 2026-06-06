-- Admin-managed upcoming events on the public home page

INSERT INTO site_content (slug, body) VALUES (
  'event_schedule',
  '{"entries": []}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
