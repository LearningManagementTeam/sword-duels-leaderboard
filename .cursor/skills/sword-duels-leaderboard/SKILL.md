---
name: sword-duels-leaderboard
description: >-
  Deploy, configure, and operate the Sword Duels Dynamic Leaderboard (Next.js,
  Supabase, Vercel). Use when the user sets up the competition site, adds admins,
  imports branches, fixes deploy/env issues, publishes rounds, or asks for
  non-developer setup steps. Distinguish owner-only manual steps from agent-automatable work.
---

# Sword Duels Leaderboard

## Project layout

- App: Next.js 16, `src/app/(site)/` public, `src/app/admin/` admin
- DB: `supabase/migrations/` + one-shot `supabase/ALL-IN-ONE-MIGRATION.sql`
- Scoring: `src/lib/scoring.ts`, `docs/mechanics.md`
- Branch CSV: `data/branches.csv` (columns: branch_code, branch_name, area, region)
- Beginner guide: `docs/SETUP-FOR-BEGINNERS.md`
- Owner checklist: `docs/CHECKLIST.md`
- Daily ops: `docs/DAILY-OPERATIONS.md`

## Owner vs agent

Read [owner-vs-agent.md](owner-vs-agent.md) before setup tasks. **Never** ask the owner to run terminal commands unless they chose the technical path.

### Owner only (guide, do not impersonate)

- Create Supabase / Vercel / GitHub accounts
- Paste `ALL-IN-ONE-MIGRATION.sql` in Supabase SQL Editor
- Copy API keys into Vercel environment variables
- Create Auth user + run `add-admin-TEMPLATE.sql` with their email
- Import official competition data decisions; share public URL

### Agent may automate

- Git init, commit, push (with `git_write` + `network` permissions)
- Edit code, CSV, mechanics, scoring config
- `npm run build` to verify
- Generate SQL for additional admins (owner runs in dashboard)
- Fix deploy/build errors, env documentation
- Prepare branch CSV from Excel description or file in repo

## Standard deploy flow

1. Confirm migrations applied (or instruct owner to run `supabase/ALL-IN-ONE-MIGRATION.sql` once).
2. Ensure Vercel has: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
3. `npm run build` must pass before telling owner deploy is ready.
4. Owner tests: `/admin/login` → Branches import → Rounds publish → public `/june`.

## Admin workflow (reference)

1. Branches → import CSV (≥130 rows validated in `importBranchesFromCsv`)
2. Rounds → enter points → Save draft / Save & publish
3. Advancement → lock June (top 24 → July), then July (3 regions → August)

## Common fixes

| Symptom | Fix |
|---------|-----|
| Setup banner on site | Missing/wrong Vercel env vars |
| Not an admin | Insert into `admins` via SQL template |
| Empty public board | No published round yet |
| July empty | Lock June advancement first |

## When user is non-technical

- Point to `docs/SETUP-FOR-BEGINNERS.md` for their steps
- Use plain language; numbered browser steps
- Offer to handle GitHub/Vercel only after they created accounts

## Additional resources

- [owner-vs-agent.md](owner-vs-agent.md)
- [../../docs/SETUP-FOR-BEGINNERS.md](../../docs/SETUP-FOR-BEGINNERS.md)
