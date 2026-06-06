# Sword Duels Leaderboard — full project context

Read this when context is long or the task touches multiple areas. Pair with `sword-duels-supabase` skill for DB work.

## Product

Dynamic public leaderboard + central admin for a 3-phase branch competition (Philippines):

| Phase | Season slug | Public route | Advancement |
|-------|-------------|--------------|-------------|
| June Area-wide | `june_area` | `/june`, `/june/{luzon\|ncr\|vismin}` | Per-round cuts: 32→16→8 per region → **24** |
| July Regional | `july_region` | `/july`, `/july/{luzon\|ncr\|vismin}` | Per-round: 4→2→1 per region |
| August Finals | `august_finals` | `/august` | **1** champion (format TBD) |

**Elimination:** June/July use **round-only** scores; eliminated branches show **—** for future rounds. See `docs/mechanics.md`.

**Preview routes:** `/preview`, `/preview/june/[region]`, `/preview/july/[region]`, `/preview/august`, `/preview/tv`

**Live site:** https://sword-duels-leaderboard.vercel.app  
**GitHub:** LearningManagementTeam/sword-duels-leaderboard  
**Stack:** Next.js 16 App Router, Supabase (Postgres + Auth), Vercel, Tailwind 4

## Admin workflow (order)

1. **Branches** `/admin/branches` — one CSV: branch + optional reps → June R1 seed
2. **Representatives** `/admin/representatives` — table edit anytime (or re-import combined CSV on Branches)
3. **Rounds** `/admin/rounds` — points per round → draft / **Preview standings** / **Save & publish**
4. **Preview** `/admin/preview` — links to sample public boards
5. **Advancement** `/admin/advancement` — lock phase, seed next season participants
6. **Audit** `/admin/audit` — admin action log

**Auth:** Supabase users in `admins` table. Default doc email `learningmanagement2026@gmail.com` (owner sets password in Supabase).

## Data model (Supabase)

- `branches` — branch_code, branch_name, area, region, representative_1, representative_2
- `seasons`, `rounds`, `round_results`
- `published_standings` — materialized on publish
- `season_participants` — after phase lock
- `admins`, `audit_log`, `phase_locks`

**RLS:** public read published data; writes via admin + service role in server actions.

## Key code paths

| Area | Path |
|------|------|
| Scoring / tie-breakers | `src/lib/scoring.ts`, `src/lib/scoring-config.ts` |
| Branch CSV parse | `src/lib/branches-csv.ts` (quoted commas) |
| Rep CSV parse | `src/lib/representatives-csv.ts` |
| Admin actions | `src/lib/actions/admin.ts` |
| Public standings | `src/lib/data/queries.ts` |
| Preview demo data | `src/lib/demo/generate-demo-standings.ts` |
| Env validation | `src/lib/supabase/env.ts` |

## CSV templates (public)

- `/templates/participants-import-template.csv` — **combined** (branches + reps)
- `/templates/branches-import-template.csv` — alias, same columns

## Deploy / env (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Build fails if URL invalid. Admin routes `force-dynamic`.

## Owner vs agent

- **Owner:** accounts, first Supabase SQL if MCP unlinked, share public URL
- **Agent:** code, migrations via MCP, git push, build verify, CSV/parser fixes

## Common errors

| Symptom | Cause | Fix |
|---------|-------|-----|
| Invalid region "Area 14" on CSV | Comma in branch name unquoted | CSV UTF-8, quoted name |
| Invalid supabaseUrl on Vercel | Bad/missing env | Fix 3 vars, redeploy |
| column representative_1 does not exist | Migration 003 not applied | MCP or SQL 003 |
| column eliminated_in_round does not exist | Migration 004 not applied | MCP or SQL 004 |
| Not an admin | Missing `admins` row | SQL insert from template |

## Docs for humans

- `docs/SYSTEM-BUILD-JOURNAL.md` — day-by-day plain-language log of what was built
- `docs/SETUP-FOR-BEGINNERS.md`
- `docs/DAILY-OPERATIONS.md`
- `docs/DEFAULT-ADMIN.md`
- `docs/VERCEL-ENV-FIX.md`

## Migrations

`supabase/migrations/` + `ALL-IN-ONE-MIGRATION.sql` (fresh DB).  
Agent: use **sword-duels-supabase** skill + MCP `apply_migration`.
