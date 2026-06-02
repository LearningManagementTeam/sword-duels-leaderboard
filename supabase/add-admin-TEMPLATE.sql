-- Replace YOUR-EMAIL@company.com with the admin's login email, then Run once in Supabase SQL Editor.

INSERT INTO admins (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'YOUR-EMAIL@company.com';
