# Sword Duels ecosystem audit — June 2026

Snapshot after: area green winner styling, area status badges, production wildcard, **production knockout** (migration 020), hub status chips, nationals phase strip, **public sub-nav + journey bar**, admin breadcrumbs on area editor.

See also: [journey-routing-2026-06.md](./journey-routing-2026-06.md) for customer-journey and routing audit.

## Executive summary

**Area + nationals wildcard + knockout are production-wired.** Knockout follows the same architecture as wildcard/area sets: `sd_knockout_*` tables, sync on field lock, per-match score/publish/unpublish, automatic advancement R16→Final. Public hub shows rep names + phase chips; admin dashboard has nationals phase strip; area-final unpublish warns about wildcard/knockout reset.

**Remaining gaps:** Optional employee metadata on area bracket slots; admin nav grouping polish.

## Scorecard

| Dimension | Public | Admin | Notes |
|-----------|--------|-------|-------|
| Design consistency | **4** | **4** | Hub status chips; knockout winner/loser on duels |
| Layout balance | **3.5** | **4** | Nationals page still long (wildcard + knockout) |
| Gamification | **4.5** | **3.5** | Maps excellent; knockout admin is form-first |
| Dynamic effects | **4.5** | **3** | Rich public motion |
| Interactivity | **3.5** | **4** | Knockout score/publish live |
| Fun vibe | **4** | **3.5** | Phase strip improves operator clarity |
| Professionalism | **4** | **4** | Live vs preview on nationals; migration banners |

**Overall:** Public **~4.0** · Admin **~3.9** · Ecosystem **~4.0**

## Strengths

1. **Area bracket UX** — Green winner glow, gray losers, `SdSpotPedestal` / final faceoff, mobile journey; **Area Champion** label scoped correctly to rep.
2. **Visual phases** — Green (area) vs purple (wildcard) vs gold accents (nationals climax) reads as intentional escalation.
3. **Admin area status** — `SdAreaStatusBadge` on dashboard gives at-a-glance progress (awaiting groups → spot secured → final → champion).
4. **Wildcard production** — Sync from area finals, tiebreak scoring, publish/unpublish, distinct purple theme.
5. **Knockout presentation** — Vertical battle path, VS pulse, champion pedestal; participant cards carry branch, employee no., position from area rep data.
6. **Operator guards** — Set lock reasons, missing-set sync banner, migration error messages with file names.

## Friction register

### P0 — Wrong outcome or production risk

| ID | Finding | Status |
|----|---------|--------|
| SD-P0-1 | Knockout admin scoring + DB | **Fixed** — `020_sd_nationals_knockout.sql`, `knockout-sync.ts`, `KnockoutAdminForm` |
| SD-P0-2 | Migration 019 required for wildcard | **Applied in prod** — tables + enums verified |
| SD-P0-3 | Area count from live roster | **Fixed** — `model.roster.totalAreaCount` (no hardcoded 15 on live paths) |

### P1 — Confusion, extra work, parity gaps

| ID | Finding | Status |
|----|---------|--------|
| SD-P1-1 | Preview knockout link on production hub | **Fixed** — removed from hub |
| SD-P1-2 | Hub branch name vs rep name | **Fixed** — rep name on hub cards |
| SD-P1-3 | Public area cards lack status | **Fixed** — `SdPublicAreaStatus` |
| SD-P1-4 | **No nationals / wildcard TV mode** | **Fixed** — `?mode=nationals`, `?mode=event&rotate=90` |
| SD-P1-5 | **Nationals page long scroll** | **Fixed** — collapsible knockout section |
| SD-P1-6 | **Plain group standings** | **Fixed** — `AreaGroupStandingsPanel` collapsible + styled |
| SD-P1-7 | **No SD daily-ops doc** | **Fixed** — `docs/SD-DAILY-OPERATIONS.md` |
| SD-P1-8 | **Dual admin products** | **Fixed** — callout on SD dashboard |
| SD-P1-9 | **Area slots missing employee metadata** | **Fixed** — `SdBracketSlot` + `tournament-map` |
| SD-P1-10 | **Unpublish area final warning** | **Fixed** — confirm in `SdSetScoresForm` |

### P2 — Polish

| ID | Finding | Location |
|----|---------|----------|
| SD-P2-1 | Gold on hub rep line | **Fixed** — emerald status chips (prior sprint) |
| SD-P2-2 | `AreaTournamentMap` gold header badge | **Fixed** — green gradient |
| SD-P2-3 | Admin nav flat pills | **Fixed** — Operate / Roster / Site groups |
| SD-P2-4 | Mechanics pages don’t mention nationals phases | **Fixed** — `SD_NATIONALS_PHASES` on public mechanics |
| SD-P2-5 | Public nationals metadata title says “Wild card” only | `nationals/page.tsx` metadata |
| SD-P2-6 | Share footer generic — no phase-specific OG/social copy | `SwordDuelsPublicFooter` |

## Operational blind spots

| Topic | Risk | Mitigation |
|-------|------|------------|
| Knockout not in DB | Committee cannot record nationals results in-app | Migration + admin forms + publish pipeline (mirror wildcard pattern) |
| Wildcard tie logic | Edge case with partial area finals published | Document “all reps locked” gate; test multi-tie scenario |
| Sync dependency | Areas empty if NC branches not imported | Dashboard copy exists; add checklist on first run |
| Rep CSV unknown codes | Import warns but doesn’t block | Pre-flight validate before event day |
| RLS on wildcard scores | Public must not leak drafts | Verify in Supabase advisors after 019 |
| Event-day TV | No single URL for “nationals night” | Add `/sword-duels/tv?mode=nationals` or rotate phases |
| Preview routes | Legacy redirects exist but hub still links preview | Remove preview CTA when knockout goes live |
| Rep vs branch on hub | Audience cares about people | Use `active_representative_name` when final published |

## Recommended sprint order

### Sprint A — Production truth (P0)
1. Knockout schema + admin scoring + publish + bracket advancement.
2. Confirm 019 applied; add admin system migration list entry.
3. Fix area count from live roster (`totalAreaCount`) everywhere.

### Sprint B — Operator confidence (P1)
1. SD daily operations doc (sync → area sets → nationals wildcard → knockout).
2. Nationals phase strip on admin dashboard (areas complete / wildcard / knockout round).
3. Unpublish warnings for area final affecting wildcard.

### Sprint C — Public parity (P1–P2)
1. Hub: rep name + public status chip; remove preview link when knockout live.
2. Collapsible knockout on nationals until field locked; or separate `/nationals/knockout` route.
3. Nationals TV / wildcard TV mode.

### Sprint D — Delight polish (P2)
1. Gamify or collapse group standings on area page.
2. Extend employee metadata to area bracket slots (optional TV density mode).
3. Unified mechanics journey covering all three nationals phases.
