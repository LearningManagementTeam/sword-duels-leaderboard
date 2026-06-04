---
name: sword-duels-leaderboard
description: >-
  Sword Duels Dynamic Leaderboard (Next.js, Supabase, Vercel): deploy, admin
  workflows, branch/representative CSV import, rounds, scoring, June/July/August
  phases. Use when context is stale, the user continues setup, or any task on this
  repo. Read PROJECT-CONTEXT.md when about to lose thread of the whole system.
---

# Sword Duels Leaderboard

## Communicating with the project owner

**Read [beginner-friendly-guide](../beginner-friendly-guide/SKILL.md)** when explaining work to the non-developer owner. Use plain language, what/why/plan structure, and browser-only steps for them.

## Context recovery (read first if thread is long)

**Read [PROJECT-CONTEXT.md](PROJECT-CONTEXT.md)** — product phases, schema, routes, code map, errors, live URLs.

For database changes → use skill **sword-duels-supabase** (MCP `apply_migration`).

For admin panel work (rounds, publish, advancement, audit) → read skill **sword-duels-admin**.

## Quick reference

| Surface | URL |
|---------|-----|
| Public | `/`, `/june`, `/july`, `/august`, `/tv`, `/preview/*` |
| Admin | `/admin/login`, `/admin/branches`, `/admin/representatives`, `/admin/rounds` |
| Live | sword-duels-leaderboard.vercel.app |

## Admin data entry

1. **Branches** — CSV import (130+), quoted commas in names
2. **Representatives** — CSV import **or** table edit, **anytime** (not only pre-competition)
3. **Rounds** — publish updates public standings
4. **Advancement** — after phase ends

## Owner vs agent

[owner-vs-agent.md](owner-vs-agent.md) — owner does accounts/secrets; agent does code, MCP migrations when linked, `npm run build`, git push.

## Docs

- [../../docs/SETUP-FOR-BEGINNERS.md](../../docs/SETUP-FOR-BEGINNERS.md)
- [../../docs/DAILY-OPERATIONS.md](../../docs/DAILY-OPERATIONS.md)
