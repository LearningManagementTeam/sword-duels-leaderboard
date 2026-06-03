-- Admin-controlled competition progress map (home page)

INSERT INTO site_content (slug, body) VALUES (
  'competition_map',
  '{
    "milestoneId": "june_r1",
    "regionHighlight": "all",
    "publicCaption": "Competition is underway — June Round 1 across all regions.",
    "showContestantList": true
  }'::jsonb
) ON CONFLICT (slug) DO NOTHING;
