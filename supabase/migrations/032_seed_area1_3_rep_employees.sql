-- Seed Area 1–3 Sword Duels rep employees (directory only; rep slots linked separately).
-- Source: operator roster sheet screenshot (Varsity 1/2 = Rep 1/2).

INSERT INTO employees (employee_no, full_name, position, employment_status, home_branch_id, created_at, updated_at)
SELECT v.employee_no, v.full_name, v.position, 'active'::employment_status, b.id, now(), now()
FROM (VALUES
  ('72248', 'Diana Chavez', 'Gaming Attendant', '671'),
  ('72090', 'Cendylny Dar', 'Gaming Attendant', '671'),
  ('13986', 'Darence Mae Sendayen', 'Cashier', '415'),
  ('13991', 'Jayson Roldan', 'Cashier', '415'),
  ('15133', 'Aiza P. Miguel', 'Operations Supervisor', '556'),
  ('15937', 'John Francis C. Dela Umbria', 'Card Custodian', '556'),
  ('72396', 'Marnell Agana', 'Gaming Attendant', '623'),
  ('15064', 'Mutya Omega Frias', 'Cashier', '421'),
  ('71691', 'Cristina Mae Ramos', 'Gaming Attendant', '421'),
  ('70161', 'Mary Joyce Lim', 'Gaming Attendant', '606'),
  ('71737', 'Jennylyn Mañozo', 'Gaming Attendant', '606'),
  ('13990', 'Kristine Padilla', 'Senior Cashier', '416'),
  ('72292', 'Joy Estrada', 'Gaming Attendant', '416'),
  ('69124', 'Glaiza Mae Quiballo', 'Gaming Attendant', '703'),
  ('72015', 'Geraldine Macaraig', 'Gaming Attendant', '703'),
  ('67847', 'Marvin Dullas', 'Gaming Attendant', '557'),
  ('102274', 'Mark Andrei De Guzman', 'Bingo Technician', '557'),
  ('12363', 'Efren C. Panit Jr', 'Operations Supervisor', '810'),
  ('12713', 'Jayson Dela Cruz', 'Operations Supervisor', '810'),
  ('15131', 'Michael Bernardino', 'Senior Cashier', '707'),
  ('72277', 'Angelica Carera', 'Gaming Attendant', '707'),
  ('69212', 'Aira T. Gamboa', 'Gaming Attendant', '656'),
  ('70014', 'Lerma Esteban', 'Gaming Attendant', '515'),
  ('71669', 'Genesis Grace Domingo', 'Gaming Attendant', '515'),
  ('71584', 'Jefferson Guillermo', 'Gaming Attendant', '414'),
  ('70515', 'Angelo Miclat', 'Gaming Attendant', '414'),
  ('72362', 'Claire Castillo', 'Gaming Attendant', '533'),
  ('67565', 'Felipe Corpuz', 'Gaming Attendant', '533'),
  ('13764', 'Erma Mercader', 'Operations Supervisor', '750'),
  ('70145', 'Eulanda Asuncion', 'Gaming Attendant', '750'),
  ('71882', 'Leonalie Reyes', 'Gaming Attendant', '422'),
  ('71897', 'Diana Rose Caperlac', 'Gaming Attendant', '422'),
  ('71525', 'Maricel Cayabyab', 'Gaming Attendant', '417'),
  ('71360', 'Cherry Mae Santos', 'Gaming Attendant', '417'),
  ('70123', 'Kristoff Castillo', 'Gaming Attendant', '513'),
  ('70756', 'Marc Rhian Ramiro', 'Gaming Attendant', '513'),
  ('69491', 'Gener Cabezon', 'Gaming Attendant', '672'),
  ('71279', 'Ivy Jett Santos', 'Gaming Attendant', '672'),
  ('68520', 'Christian Alda', 'Gaming Attendant', '968'),
  ('16018', 'Ena Rose Dimarucot', 'Cashier', '968'),
  ('LEGACY-605-1', 'Renato Damaso Jr.', 'Card Custodian', '605'),
  ('LEGACY-605-2', 'Julius Buenaventura', 'Gaming Attendant', '605'),
  ('LEGACY-664-1', 'Krystlle Joy Muncal', 'Gaming Attendant', '664'),
  ('LEGACY-664-2', 'John Alvin Bagsik', 'Gaming Attendant', '664')
) AS v(employee_no, full_name, position, branch_code)
JOIN branches b ON b.branch_code = v.branch_code
ON CONFLICT (employee_no) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  position = EXCLUDED.position,
  home_branch_id = EXCLUDED.home_branch_id,
  updated_at = now();
