-- Seed Area 3–6 Sword Duels rep employees (directory only; rep slots linked separately).
-- Source: operator roster sheet screenshot (Varsity 1/2 = Rep 1/2).

INSERT INTO employees (employee_no, full_name, position, employment_status, home_branch_id, created_at, updated_at)
SELECT v.employee_no, v.full_name, v.position, 'active'::employment_status, b.id, now(), now()
FROM (VALUES
  ('71962', 'Jessa Fernandez', 'Gaming Attendant', '65'),
  ('72310', 'Trisha Mae Santos', 'Gaming Attendant', '65'),
  ('13918', 'Carla Joy Geronimo', 'Senior Cashier', '598'),
  ('70365', 'Renzo Gatchalian', 'Gaming Attendant', '598'),
  ('69640', 'Christopher Flores', 'Gaming Attendant', '611'),
  ('70452', 'Mary Grace Escoto', 'Gaming Attendant', '611'),
  ('71899', 'Kenneth Cristian Camus', 'Gaming Attendant', '705'),
  ('70633', 'Liza Marie', 'Gaming Attendant', '705'),
  ('71264', 'Karen Diaz', 'Gaming Attendant', '642'),
  ('72313', 'Ana Jewella Valmonte', 'Gaming Attendant', '642'),
  ('71838', 'Rochelle Villanueva', 'Gaming Attendant', '37'),
  ('71984', 'Glydhell Gullod', 'Gaming Attendant', '37'),
  ('69037', 'Cristina May Atacador', 'Gaming Attendant', '22'),
  ('71100', 'Sarah Jane Bautista', 'Gaming Attendant', '22'),
  ('70280', 'Juvy Anne Javier', 'Gaming Attendant', '544'),
  ('71683', 'Bernie Turla', 'Gaming Attendant', '544'),
  ('70850', 'Junie Ann L. Villa', 'Gaming Attendant', '649'),
  ('71727', 'Gina E. Arroyo', 'Gaming Attendant', '649'),
  ('69964', 'Joy Burabo', 'Gaming Attendant', '567'),
  ('70952', 'Udessa Bono', 'Gaming Attendant', '567')
) AS v(employee_no, full_name, position, branch_code)
JOIN branches b ON b.branch_code = v.branch_code
ON CONFLICT (employee_no) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  position = EXCLUDED.position,
  home_branch_id = EXCLUDED.home_branch_id,
  updated_at = now();
