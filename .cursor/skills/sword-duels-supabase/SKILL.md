---
name: sword-duels-supabase
description: >-
  Apply Supabase migrations and database changes for Sword Duels Leaderboard via
  MCP (apply_migration, execute_sql, list_tables). Use when schema changes are
  needed, representatives columns, RLS, or the user asks to update the database
  automatically instead of manual SQL Editor paste.
---

# Sword Duels — Supabase (agent)

## When to use

- New file in `supabase/migrations/`
- User asks to "run migration" or "update database"
- Errors: missing column `representative_1`, relation does not exist

## MCP workflow (preferred — agent runs this)

1. `list_projects` — get `project_id` for Sword Duels.
2. If **no projects**: tell user to link Supabase in Cursor (MCP auth) or share project ref. Fall back to SQL paste in Dashboard.
3. `list_migrations` — see what is already applied.
4. `apply_migration` with `name` (snake_case) and full SQL from the migration file.
5. `list_tables` or `execute_sql` — verify columns on `branches`.
6. `get_logs` if API errors after deploy.

### Migration order

| File | Purpose |
|------|---------|
| `001_initial_schema.sql` | Core tables (skip if already ran ALL-IN-ONE) |
| `002_rls_policies.sql` | RLS |
| `003_branch_representatives.sql` | `representative_1`, `representative_2` |

If user ran `ALL-IN-ONE-MIGRATION.sql` before representatives columns were added, apply **only** `003` (or re-run ALL-IN-ONE on empty DB — never on production with data).

### Apply 003 only (common)

```sql
ALTER TABLE branches
  ADD COLUMN IF NOT EXISTS representative_1 TEXT,
  ADD COLUMN IF NOT EXISTS representative_2 TEXT,
  ADD COLUMN IF NOT EXISTS representatives_updated_at TIMESTAMPTZ;
```

## Owner fallback (no MCP access)

1. Supabase Dashboard → SQL Editor
2. Paste from `supabase/migrations/00X_*.sql`
3. Run

## Never

- Commit `service_role` key or passwords
- `apply_migration` with destructive DROP on production without explicit user request

## Project link

- App env: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` on Vercel
- Repo migrations: `supabase/migrations/`

See [../sword-duels-leaderboard/PROJECT-CONTEXT.md](../sword-duels-leaderboard/PROJECT-CONTEXT.md) for full app context.
