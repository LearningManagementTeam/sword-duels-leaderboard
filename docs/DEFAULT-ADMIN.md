# Default admin account

Use **one** of these methods. Do not share the admin password in public chat or email blasts.

## Recommended login

| Field | Value |
|-------|--------|
| **Email** | `learningmanagement2026@gmail.com` |
| **Password** | `learningmanagement2026` |

Sign in at: `https://sword-duels-leaderboard.vercel.app/admin/login`

---

## Method A — Supabase Dashboard (no terminal)

1. [Supabase](https://supabase.com) → your project → **Authentication** → **Users**
2. **Add user** → **Create new user**
3. **Email:** `learningmanagement2026@gmail.com`
4. **Password:** `learningmanagement2026` (change after first login if possible)
5. **Create user**
6. **SQL Editor** → New query → Run (use the same email):

```sql
INSERT INTO admins (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'learningmanagement2026@gmail.com';
```

7. Sign in on the live site.

---

## Method B — One-time script (on your Mac)

1. Open Terminal in the project folder.
2. Paste your Supabase **Project URL** and **service_role** key into the command (from Supabase → Settings → API).
3. Run:

```bash
cd ~/Desktop/Sword\ Duels\ Leaderboard
ADMIN_EMAIL=learningmanagement2026@gmail.com \
ADMIN_PASSWORD='learningmanagement2026' \
NEXT_PUBLIC_SUPABASE_URL='https://YOUR-PROJECT.supabase.co' \
SUPABASE_SERVICE_ROLE_KEY='YOUR-SERVICE-ROLE-KEY' \
node scripts/create-default-admin.mjs
```

4. You should see **Default admin is ready.**

---

## Security notes

- Change the password in Supabase after go-live if this was shared widely.
- Never commit passwords to GitHub.
- Only the **central team** should use `/admin/login`.
