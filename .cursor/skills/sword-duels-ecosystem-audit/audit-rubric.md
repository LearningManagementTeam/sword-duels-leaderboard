# Sword Duels — Audit rubric

Score each dimension **1 (weak) → 5 (excellent)** separately for **Public** and **Admin**. Note mixed scores when surfaces diverge.

## Dimensions

### 1. Design consistency

Neon-glass identity, hierarchy, spacing, typography, semantic color (green area / purple wildcard / gold nationals climax).

| 5 | All surfaces use `sd-*` primitives; color roles consistent; mobile/desktop balanced |
| 3 | Strong hero components but plain secondary sections (e.g. group standings tables) |
| 1 | Ad-hoc colors, broken hierarchy, or clashing themes |

**Check:** `AreaTournamentMap`, `NationalsKnockoutMap`, admin forms, hub cards, `globals.css` animation classes.

### 2. Layout balance

Information density, visual weight, scan path, long-page fatigue.

| 5 | Clear focal point per viewport; secondary detail collapsible or below fold |
| 3 | Rich maps but long scroll (nationals page = wildcard + full knockout) |
| 1 | Cramped mobile bracket or orphaned whitespace |

**Check:** Mobile journey (`SdMobileBracketJourney`), nationals stacked phases, admin score tables.

### 3. Gamification

Progress cues, rivalry, celebration, status labels, pedestal/VS/trophy metaphors.

| 5 | Bracket feels like a tournament arc; status copy motivates return visits |
| 3 | Gamified maps but utilitarian standings/admin forms |
| 1 | Spreadsheet-only; no sense of progression |

**Check:** `SdSpotPedestal`, `SdFinalDuelFaceoff`, `NationalsKnockoutJourney`, `SdAreaStatusBadge`, mechanics copy.

### 4. Dynamic effects

Motion, glow, shimmer, pulse — purposeful not decorative noise.

| 5 | Effects reinforce state (winner, live duel, wildcard); reduced-motion safe |
| 3 | Good area effects; knockout/nationals partially animated |
| 1 | Static or motion overload / performance issues |

**Check:** `.sd-bracket-*`, `.sd-wildcard-*`, `.sd-knockout-*` in `globals.css`, `ArBackdrop`.

### 5. Interactivity

Taps, links, TV rotate, share, admin publish flow, feedback on actions.

| 5 | ≤2 taps to key views; admin publish confirms with progress; share works |
| 3 | Read-mostly public; admin interactive but no knockout scoring |
| 1 | Dead ends, broken links, no operator feedback |

**Check:** Hub links, TV rotator, `SdSetScoresForm`, `WildcardAdminForm`, footer share.

### 6. Fun vibe

Energy, copy tone, “arena” feel vs corporate dashboard.

| 5 | Public copy celebrates progress; admin stays clear but not sterile |
| 3 | Public fun; admin functional |
| 1 | Jargon-heavy or flat everywhere |

**Check:** `bracket-copy.ts`, mechanics pages, empty states, preview CTAs.

### 7. Professionalism

Trust, clarity, committee-ready, no misleading live state, operator confidence.

| 5 | Draft vs published obvious; rep/branch metadata accurate; runbook exists |
| 3 | Strong UI but knockout placeholder could confuse; hub shows branch not rep |
| 1 | Wrong champion styling, missing migrations silently, preview leaks |

**Check:** Public filter on scores, migration banners, rep vs branch display, admin lock gates.

## Per-surface quick pass

| Surface | Design | Balance | Game | Motion | Interact | Fun | Pro |
|---------|--------|---------|------|--------|----------|-----|-----|
| Hub | | | | | | | |
| Area map | | | | | | | |
| Area standings (bottom) | | | | | | | |
| TV | | | | | | | |
| Wildcard map | | | | | | | |
| Knockout map | | | | | | | |
| Admin dashboard | | | | | | | |
| Admin area scoring | | | | | | | |
| Admin nationals | | | | | | | |

## Friction severity

| Level | Definition | Examples |
|-------|------------|----------|
| **P0** | Wrong data shown, blocked operator, prod broken | Migration not run; publish without sync; knockout looks live but isn’t |
| **P1** | Extra steps, inconsistent identity, discoverability | Hub champ = branch name; preview link on public hub; no nationals TV |
| **P2** | Polish, parity, delight | Group standings plain; gold on hub rep line; admin nav grouping |

## Operational blind-spot checklist

- [ ] **Migration state** — 016 repair + 019 wildcard in prod Supabase
- [ ] **Area count** — CSV may be 14 areas; knockout assumes 15 + wildcard
- [ ] **Sync workflow** — NC branches import → SD sync → reps → score (documented for owner?)
- [ ] **Wildcard rules** — 2nd-highest area-final loser; ties → tiebreak round
- [ ] **Unpublish cascade** — area final unpublish resets wildcard; operator warned?
- [ ] **Knockout gap** — no DB, no admin scores, no advancement R16→Final
- [ ] **TV scope** — area rotate only; no nationals/wildcard full-screen mode
- [ ] **RLS** — public never sees draft wildcard/area scores
- [ ] **Rep metadata** — employee no / position on knockout cards; not on area slots
- [ ] **Dual product** — NC admin vs SD admin; operator knows which panel for what
- [ ] **Preview URLs** — `/preview/sword-duels/nationals/knockout` still linked from production hub
