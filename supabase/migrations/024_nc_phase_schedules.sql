-- Per-phase NC round dates for the home page Upcoming column

INSERT INTO site_content (slug, body) VALUES (
  'nc_phase_schedules',
  '{"june":{},"july":{},"august":{}}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
