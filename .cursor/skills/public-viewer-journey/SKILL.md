---
name: public-viewer-journey
description: >-
  Public-facing UX for Sword Duels Leaderboard — standings-first layout, mobile
  bottom nav + desktop nav, competition-map-driven standings link, no admin/export
  on public surfaces. Use when changing home page, public navigation, leaderboard
  page order, or any task that affects what casual viewers see.
---

# Public viewer journey

## Audience

Public viewers open the site to **see scores and who advanced** — not to export data, configure the site, or reach admin tools.

## Core rules

1. **Results first** — On region/finals pages, the leaderboard table must appear within one mobile viewport when data exists.
2. **Public vs admin** — No Export CSV, admin links, preview links, or setup instructions on public UI. Export API requires admin auth.
3. **Tap budget** — Live standings reachable in ≤2 taps from home (bottom nav **Standings** = one tap).
4. **Content order (home)** — Live standings preview → Branding (logo/carousel) → Season journey (collapsed by default) → Share.
5. **Content order (board pages)** — Sticky phase/region bar → Leaderboard → Collapsible progress/status below.
6. **Navigation** — Mobile: fixed bottom glass bar. Desktop: fixed top glass bar. Same four destinations only.
7. **Smart Standings link** — Driven by `CompetitionMapConfig.milestoneId` via `resolvePublicStandingsHref()` (finals when map says August, etc.) — not “last CSV export” or arbitrary default.
8. **Empty states** — One clear message when R0; avoid stacking chrome with no data.

## Public nav items (only these)

| Label | Target | Active when |
|-------|--------|-------------|
| Home | `/` | pathname `/` |
| Standings | `resolvePublicStandingsHref(map)` | `/june/*`, `/july/*`, `/august` |
| Phases | `resolvePublicPhaseHref(map)` | `/june`, `/july`, `/august` (exact) |
| Rules | `/mechanics` | `/mechanics` |

**Never in public nav:** Admin, Preview, TV, Export CSV.

## Key files

| Area | Files |
|------|--------|
| Standings URL | `src/lib/public-standings-route.ts` |
| Nav shell | `src/components/nav/PublicNav.tsx` |
| Sticky context | `src/components/nav/StandingsContextBar.tsx` |
| Home preview | `src/components/home/HomeStandingsPreview.tsx` |
| Board layout | `src/components/PhaseLeaderboard.tsx` |
| Site layout | `src/app/(site)/layout.tsx` |
| Map data | `getCompetitionMap()`, Admin → `/admin/competition` |

## Related skills

- **sword-duels-neon-glass** — visual styling (`sd-glass`, neon panels)
- **beginner-friendly-guide** — explain changes to non-developer owner

## Do / Don't

**Do:** Collapse secondary context (round progress, status ticker) below the table; use `layout="home"` / skip hero on board subpages.

**Don't:** Re-add top SiteHeader with admin; expose `/api/export` without admin gate; put competition map above standings on home.
