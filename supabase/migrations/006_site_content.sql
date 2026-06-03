-- Editable public site content (mechanics intro, announcements, etc.)

CREATE TABLE site_content (
  slug TEXT PRIMARY KEY,
  body JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by_email TEXT
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY site_content_select ON site_content
  FOR SELECT USING (true);

CREATE POLICY site_content_admin ON site_content
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

INSERT INTO site_content (slug, body) VALUES (
  'mechanics_public',
  '{"intro":"Welcome to Sword Duels 2026. Standings update after each published round. Rules below are kept in sync with the competition system.","announcements":"","custom_sections":[]}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
