# Customer journey & routing audit — June 2026

Post-implementation snapshot after sub-nav, journey bar, admin breadcrumbs.

## Route map (canonical)

### Public Sword Duels

| Route | Purpose | Tap budget from SD hub |
|-------|---------|------------------------|
| `/sword-duels` | Area hub | 0 (home) |
| `/sword-duels/[area]` | Live bracket + standings | 1 |
| `/sword-duels/nationals` | Wildcard + knockout | 1 (sub-nav) |
| `/sword-duels/mechanics` | Rules journey | 1 (sub-nav) |
| `/sword-duels/tv` | Full-screen display | 1 (sub-nav) |
| `/sword-duels/tv?mode=event&rotate=90` | Event rotate | 2 (TV → rotate link) |

**Entry from site home:** Programs strip → Sword Duels (2 taps). Global nav does **not** list SD (by design — NC home is primary).

### Admin Sword Duels

| Route | Purpose |
|-------|---------|
| `/admin` | Product hub |
| `/admin/sword-duels` | Dashboard + phase strip + sync |
| `/admin/sword-duels/areas` | Area list (duplicate of dashboard cards) |
| `/admin/sword-duels/areas/[area]` | Score/publish sets |
| `/admin/sword-duels/nationals` | Wildcard + knockout admin |
| `/admin/sword-duels/representatives` | Rep CSV/table |
| `/admin/sword-duels/brackets` | Read-only structure |
| `/admin/sword-duels/mechanics` | Public copy editor |

**Branch import:** `/admin/national-competitions/branches` only.

### Legacy / preview (avoid in operator comms)

| Route | Status |
|-------|--------|
| `/preview/sword-duels/nationals` | Redirects to preview knockout |
| `/preview/sword-duels/nationals/knockout` | Placeholder demo only |
| `/admin/sword-duels/preview/nationals-wildcard` | Stale preview — prefer live nationals |

## Journey scorecard

| Dimension | Public | Admin |
|-----------|--------|-------|
| Discoverability | **3.5** — sub-nav added; still 2 taps from site home | **4** — hub + grouped nav + callout |
| Wayfinding | **4** — journey bar + area status chips | **4** — breadcrumbs on area editor |
| Confusion risk | **3.5** — two `/mechanics` URLs (site vs SD) | **3.5** — dashboard vs areas list duplicate |
| Gamification | **4.5** — journey progress bar, bracket motion | **3** — functional forms |
| Routing clarity | **4** — flat `/sword-duels/*` tree | **4** — `/admin/sword-duels/*` consistent |

## Remaining friction (prioritized)

### P1 — Confusion

| ID | Issue | Mitigation |
|----|-------|------------|
| JR-P1-1 | `/mechanics` (NC) vs `/sword-duels/mechanics` (SD) | Cross-link each page; optional rename SD to "How Sword Duels works" in nav only |
| JR-P1-2 | Admin **Areas** page duplicates dashboard list | Merge into dashboard or make Areas the canonical list and slim dashboard |
| JR-P1-3 | Preview knockout URL still reachable | Redirect to `/sword-duels/nationals` when field locked (server) |
| JR-P1-4 | Knockout admin forms list all matches — long on event day | Group by round; collapse published |

### P2 — Polish

| ID | Issue |
|----|-------|
| JR-P2-1 | Wildcard + knockout both link to same nationals URL in journey bar — add `#knockout` anchor |
| JR-P2-2 | Site home Programs strip doesn’t show SD phase progress |
| JR-P2-3 | Admin nationals page: no breadcrumb |
| JR-P2-4 | `SdSetScoresForm` still uses `window.confirm` for area final unpublish |
| JR-P2-5 | Stale admin preview route `preview/nationals-wildcard` |

## Implemented this audit

- `SwordDuelsPublicNav` — Areas | Nationals | How it works | TV
- `SdPublicJourneyBar` — progress % + phase pills
- `sword-duels/layout.tsx` — shared chrome (hidden on TV)
- Hub champion uses active area-final rep
- Admin area breadcrumb + public map link
- Header link deduplication on hub/nationals

## Implemented follow-up (priority slice)

- `ProgramRulesCrossLink` — NC ↔ SD mechanics cross-links
- Preview knockout redirects to live `#knockout` when field locked
- Admin dashboard slimmed — area cards only on `/areas`; dashboard shows summary + link
- `#wildcard` / `#knockout` anchors + `SdAnchorOpener` for collapsible knockout
- Admin breadcrumbs on Areas index + Nationals admin
- `HomeProgramsStrip` — live SD progress on site home

## Implemented second slice

- `KnockoutAdminForm` — grouped by round (collapsible), progress bar, **Next up** jump link
- `SdSetScoresForm` — inline `AdminConfirmPanel` for area-final unpublish (no `window.confirm`)
- Nationals `generateMetadata` — phase-aware browser title
- `PublicNav` — third item **Sword Duels** (mobile: **Duels**)

## Implemented third slice

- `share-metadata.ts` — phase-aware `openGraph` / Twitter cards on hub, area, nationals
- `ShareCard` + `SwordDuelsPublicFooter` — phase-specific share descriptions
- `SdAreaScoreStickyNav` — sticky jump bar on admin area editor (set status + **Jump →**)
- `KnockoutAdminForm` — `AdminConfirmPanel` before knockout unpublish
