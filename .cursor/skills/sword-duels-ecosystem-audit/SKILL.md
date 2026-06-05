---
name: sword-duels-ecosystem-audit
description: >-
  Holistic audit of the Sword Duels product (area brackets, wildcard, nationals
  knockout) — design, balance, gamification, motion, interactivity, fun vs
  professional tone, operator friction, and blind spots. Use when the user asks
  to audit Sword Duels public/admin UX, review the tournament journey, or
  prioritize SD polish vs production gaps.
---

# Sword Duels — Ecosystem audit

Run when the user asks to audit **Sword Duels** (not National Competitions June/July/August boards).

**Related skills:** [sword-duels-neon-glass](../sword-duels-neon-glass/SKILL.md), [public-viewer-journey](../public-viewer-journey/SKILL.md), [sword-duels-admin/journey-audit](../sword-duels-admin/journey-audit.md), [sword-duels-supabase](../sword-duels-supabase/SKILL.md).

**Operator runbook:** [docs/SD-DAILY-OPERATIONS.md](../../docs/SD-DAILY-OPERATIONS.md)

**Latest snapshot:** [findings-2026-06.md](findings-2026-06.md) — update after each full audit.

## Tournament journey (canonical)

| Phase | Public | Admin | Data |
|-------|--------|-------|------|
| Setup | Hub empty state | Branches (NC) → Sync → Reps | `sd_events`, `sd_brackets`, branches |
| Area groups | `/sword-duels/[area]` map + standings | Area → score/publish sets | `sd_sets`, `sd_set_scores` |
| Area final | Spot pedestals, green winner glow | Gated until both groups published | `area_final` set |
| Wildcard | `/sword-duels/nationals` Phase 1 | `/admin/sword-duels/nationals` | `sd_wildcard_rounds`, `019` migration |
| Knockout | Same page Phase 3 + preview route | `/admin/sword-duels/nationals` | `sd_knockout_*` tables, migration `020` |

## Audit process (do not skip)

1. **Walk both personas** — casual viewer (phone, event floor) and central operator (laptop, weekly scoring).
2. **Score seven dimensions** (1–5) using [audit-rubric.md](audit-rubric.md).
3. **Register friction** as P0 (wrong outcome / blocked) / P1 (extra taps / confusion) / P2 (polish).
4. **Check production gaps** — migrations applied, admin parity with public phases, TV coverage.
5. **Record findings** in `findings-YYYY-MM.md`; link P0/P1 IDs in sprint backlog.

## Surface inventory

### Public

| Route | Primary components |
|-------|-------------------|
| `/sword-duels` | Hub cards, nationals/knockout links |
| `/sword-duels/[area]` | `AreaTournamentMap`, `AreaGroupSplitPanel`, group standings |
| `/sword-duels/tv` | `SdTvAreaRotator`, `AreaTournamentMap` tvMode |
| `/sword-duels/nationals` | `NationalsWildcardMap`, `NationalsKnockoutMap` |
| `/sword-duels/mechanics` | Step cards |
| `/preview/sword-duels/nationals/knockout` | Full placeholder knockout |

### Admin (`/admin/sword-duels/*`)

| Route | Purpose |
|-------|---------|
| Dashboard | Area list + `SdAreaStatusBadge`, group sort, sync hint |
| Areas / `[area]` | `SdSetScoresForm`, publish per set |
| Representatives | CSV + table |
| Brackets | Read-only structure |
| Nationals | `WildcardAdminForm` |
| Mechanics | Editable copy |

## Non-negotiable checks

### Design system

- [ ] Area winners: **green/lime** glow — not gold/yellow (gold reserved for nationals final / podium accents).
- [ ] Wildcard: **purple/fuchsia** theme distinct from area green.
- [ ] Losers: muted gray — no strikethrough on public brackets.
- [ ] `sd-*` primitives — no new raw slate/amber chrome outside alerts.
- [ ] `prefers-reduced-motion` honored on new animations.

### Gamification balance

- [ ] Motion supports readability — trophy/VS pulse not distracting on TV.
- [ ] Status copy from `bracket-copy.ts` — **Area Champion** only for area rep.
- [ ] Public hub/TV: anticipation empty states, not failure tone.

### Operational integrity

- [ ] Migrations: `016_sword_duels_repair.sql`, `019_sd_nationals_wildcard.sql` applied in prod.
- [ ] Sync from branches after NC import; sets initialized per area.
- [ ] Area final publish triggers wildcard sync; unpublish resets wildcard state safely.
- [ ] Wildcard tiebreak: admin can score, publish, unpublish; public sees draft vs published correctly (RLS).
- [ ] Knockout: migration `020` applied; sync after field lock; public shows published winners only.

### Public vs admin parity

- [ ] Every public phase has operator path (wildcard ✓, knockout ✗).
- [ ] Public area hub shows same champion identity as admin (rep name when set).
- [ ] TV mode covers event-critical views (areas ✓, nationals ✗).

## Output format (for user)

Deliver:

1. **Executive summary** — 2–3 sentences, overall health.
2. **Scorecard table** — seven dimensions × public / admin / notes.
3. **Strengths** — what already lands (design, gamification, ops).
4. **Friction register** — P0 / P1 / P2 with location.
5. **Operational blind spots** — migrations, data, runbook, edge cases.
6. **Recommended next sprints** — ordered by risk then delight.

## Regression after SD UX changes

- [ ] `npm run build`
- [ ] Public: hub → area → TV link works with published set
- [ ] Admin: dashboard status matches area page set states
- [ ] Nationals: wildcard sync after area final publish/unpublish
- [ ] No preview/admin links on public except intentional preview CTAs
