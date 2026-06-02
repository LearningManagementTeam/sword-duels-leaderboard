# Supabase — automatic updates via Cursor

The AI agent can apply database migrations for you when **Supabase MCP** is connected to your project.

## One-time: link Supabase in Cursor

1. In Cursor, ensure the **Supabase** MCP server is enabled.
2. Sign in to the Supabase organization that owns your Sword Duels project.
3. Ask the agent: *"Apply migration 003 for representatives using Supabase MCP."*

If MCP shows **no projects**, the agent will give you SQL to paste in the Dashboard instead.

## What the agent runs (when linked)

- `list_projects` → your project id
- `apply_migration` → runs SQL from `supabase/migrations/`
- Verifies `branches` has `representative_1`, `representative_2`

## Manual fallback (2 minutes)

Supabase → **SQL Editor** → paste `supabase/migrations/003_branch_representatives.sql` → **Run**.
