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
4. **Content order (home)** — Live standings preview (centered arena block) → Carousel → Season journey (collapsed) → Share. No hero logo on home.
5. **Content order (board pages)** — Sticky phase/region bar → Leaderboard → Collapsible progress/status below.
6. **Navigation** — Mobile: fixed bottom glass bar. Desktop: fixed top glass bar. Three destinations: Home, Standings, How to win.
7. **Smart Standings link** — Driven by `CompetitionMapConfig.milestoneId` via `resolvePublicStandingsHref()` (finals when map says August, etc.) — not “last CSV export” or arbitrary default.
8. **Empty states** — One clear message when R0; avoid stacking chrome with no data.

## Public nav items (only these)

| Label | Target | Active when |
|-------|--------|-------------|
| Home | `/` | pathname `/` |
| Standings | `resolvePublicStandingsHref(map)` | `/june/*`, `/july/*`, `/august` |
| Rules | `/mechanics` | `/mechanics` |

Label in nav: **How to win** (not “Rules”). No separate **Phases** item — phase tabs live on the standings board.

## Home arena block (`HomeStandingsPreview`)

**Copy rules (never violate on home):**

1. **Phase-wide, not region-specific** — Subtitle is `Luzon · NCR · VisMin` (or “National finals”), never a single region in the headline.
2. **Say the phase once** — Use phase badge (`June`) + `roundView.roundName`. Do **not** also append `seasonConfig.name` (“June — Area-wide”) or `meta.label` (“June — Round 1”) — that duplicates “June”.
3. **Preview rows** — When published, show **one leader per region** (or top finalists in August), not Luzon-only top 5.
4. **One primary CTA** — Full-width **View standings** below content; short hint line only (no wall of subtitle text on the button).
5. **Centered layout** — `max-w-3xl mx-auto text-center`; empty state icon + copy; CTA full width `max-w-md`.

Helpers: `src/lib/home-standings-display.ts` (`buildHomeArenaHeadline`, `resolveHomeStandingsCta`, `regionalBoardLinks`).

## Gamified copy tone

- Lead with **progress, rivalry, celebration** — not admin jargon.
- Active verbs: “Climb the board”, “Survive the cut”, “Crown survivors”, “The arena”.
- Empty states = **anticipation** (“Round 1 drops soon”), not failure (“No data”).
- Avoid negative framing on public pages.
- Branch counts: use `getBranchCount()` + `TARGET_BRANCH_COUNT` (135) from `src/lib/branch-targets.ts` — never hardcode 142 or 130+.

## Full leaderboard

June R3 live board: `/june/leaderboard`. R1/R2: regional URLs only.

## Key files

| Area | Files |
|------|--------|
| Standings URL | `src/lib/public-standings-route.ts` |
| Nav shell | `src/components/nav/PublicNav.tsx` |
| Sticky context | `src/components/nav/StandingsContextBar.tsx` |
| Home preview | `src/components/home/HomeStandingsPreview.tsx`, `src/lib/home-standings-display.ts` |
| Branch counts | `src/lib/branch-targets.ts`, `getBranchCount()` |
| Board layout | `src/components/PhaseLeaderboard.tsx` |
| Site layout | `src/app/(site)/layout.tsx` |
| Map data | `getCompetitionMap()`, Admin → `/admin/competition` |

## Related skills

- **sword-duels-neon-glass** — visual styling (`sd-glass`, neon panels)
- **beginner-friendly-guide** — explain changes to non-developer owner

## Do / Don't

**Do:** Collapse secondary context (round progress, status ticker) below the table; use `layout="home"` / skip hero on board subpages.

**Don't:** Re-add top SiteHeader with admin; expose `/api/export` without admin gate; put competition map above standings on home.
