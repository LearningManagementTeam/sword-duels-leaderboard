-- RLS: public read published data; admins full access

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  );
$$;

-- Branches: public read; admin write
CREATE POLICY branches_select ON branches FOR SELECT USING (true);
CREATE POLICY branches_admin ON branches FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Seasons & rounds: public read
CREATE POLICY seasons_select ON seasons FOR SELECT USING (true);
CREATE POLICY seasons_admin ON seasons FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY rounds_select ON rounds FOR SELECT USING (true);
CREATE POLICY rounds_admin ON rounds FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Round results: public only from published rounds
CREATE POLICY round_results_select ON round_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rounds r
      WHERE r.id = round_results.round_id AND r.status = 'published'
    )
  );
CREATE POLICY round_results_admin ON round_results FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- Published standings: public read
CREATE POLICY published_standings_select ON published_standings FOR SELECT USING (true);
CREATE POLICY published_standings_admin ON published_standings FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- Participants & locks: public read
CREATE POLICY season_participants_select ON season_participants FOR SELECT USING (true);
CREATE POLICY season_participants_admin ON season_participants FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY phase_locks_select ON phase_locks FOR SELECT USING (true);
CREATE POLICY phase_locks_admin ON phase_locks FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- Admins & audit: admin only
CREATE POLICY admins_select ON admins FOR SELECT USING (is_admin());
CREATE POLICY admins_admin ON admins FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY audit_select ON audit_log FOR SELECT USING (is_admin());
CREATE POLICY audit_insert ON audit_log FOR INSERT WITH CHECK (is_admin());
