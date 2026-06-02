# Owner vs agent responsibilities

## Owner (human) — must use browser / their accounts

| Step | Tool |
|------|------|
| Sign up Supabase, create project | supabase.com |
| Run ALL-IN-ONE-MIGRATION.sql | Supabase SQL Editor |
| Copy URL, anon key, service_role key | Supabase → Settings → API |
| Create admin Auth user | Supabase → Authentication |
| INSERT into admins | SQL Editor + add-admin-TEMPLATE.sql |
| Sign up Vercel, import Git repo | vercel.com |
| Paste 3 env vars, Deploy | Vercel project settings |
| Enter real competition scores | /admin on live site |
| Share public URL, train team | Email / chat / QR |

## Agent — automate in repo / terminal

| Task | Command / location |
|------|-------------------|
| Verify build | `npm run build` |
| Regenerate sample CSV | `npm run generate:branches` |
| Update mechanics / scoring | `docs/mechanics.md`, `src/lib/scoring*.ts` |
| Supabase migrations (MCP) | skill **sword-duels-supabase**, `apply_migration` |
| Merge SQL for owner (fallback) | `supabase/migrations/*.sql` |
| Git push to GitHub | git + user approval |
| Fix TypeScript/UI bugs | `src/` |
| Convert Excel → branches.csv | `data/branches.csv` |
| Representatives CSV | `ImportRepresentativesCsv.tsx` |
| Extra admin SQL snippets | from `add-admin-TEMPLATE.sql` |

## Secrets rule

- `SUPABASE_SERVICE_ROLE_KEY` → Vercel only, never client code, never chat logs
- Owner should use password manager for Supabase DB password and admin login
