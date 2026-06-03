-- Branding (logo URL) + storage bucket for admin uploads

INSERT INTO site_content (slug, body) VALUES (
  'branding',
  '{"logo_url":null,"logo_alt":"Sword Duels"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'branding',
  'branding',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY branding_storage_public_read ON storage.objects
  FOR SELECT USING (bucket_id = 'branding');

CREATE POLICY branding_storage_admin_write ON storage.objects
  FOR ALL USING (bucket_id = 'branding' AND is_admin())
  WITH CHECK (bucket_id = 'branding' AND is_admin());
