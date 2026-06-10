# Full customer journey audit — 10 June 2026

Cross-product UX audit: **public viewers**, **Revalida admin**, **Sword Duels admin**, **HRIS admin**.

Prior SD-only snapshot: [findings-2026-06.md](./findings-2026-06.md)  
HRIS detail: [../hris-journey-audit/findings-2026-06-10.md](../hris-journey-audit/findings-2026-06-10.md)  
NC admin sprints: [../sword-duels-admin/journey-audit.md](../sword-duels-admin/journey-audit.md)

---

## Executive summary

The platform is **production-capable** with a strong visual identity and clear product split (HRIS → Revalida → public). **National Competitions public boards** have the best information hierarchy in the repo. **Sword Duels area pages** prioritize bracket spectacle over standings scan path. **HRIS** recently improved for desktop operators but still splits rep workflow across two surfaces. No active P0 “wrong live data” issues found in code review; remaining pain is **discoverability, depth of navigation, and setup completeness signals**.

**Ecosystem health: ~3.8 / 5**

---

## Personas

| Persona | Device | Goal | Success metric |
|---------|--------|------|----------------|
| **Casual viewer** | Phone, event floor | Who’s winning / who advanced | Answer in ≤2 taps, ≤1 screen scroll |
| **Weekly operator** | Laptop | Score → publish → verify public | ≤3 intentional steps; no fear of breaking live site |
| **Setup operator** | Laptop (pre-event) | Branches + employees + reps | 135 / N employees / rep coverage visible |
| **Committee / TV** | Large display | Rotating areas or nationals | Readable at distance; no draft leakage |

---

## Scorecard (seven dimensions)

| Dimension | Public | NC Admin | SD Admin | HRIS Admin |
|-----------|:------:|:--------:|:--------:|:----------:|
| **Clarity** | 4.0 | 4.0 | 3.5 | 4.0 |
| **Hierarchy** | 3.5 | 4.5 | 4.0 | 4.0 |
| **Friction** | 3.5 | 3.5 | 3.0 | 3.0 |
| **Interactivity** | 4.0 | 4.0 | 4.0 | 3.5 |
| **Dynamism** | 4.5 | 3.0 | 3.0 | 2.5 |
| **Visual polish** | 4.5 | 4.0 | 4.0 | 4.0 |
| **Ease of use** | 4.0 | 4.0 | 3.5 | 3.5 |
| **Viewer/operator parity** | — | 3.5 | 3.5 | 3.5 |

**Notes:**
- NC public = gold standard for standings-first layout.
- SD public = best gamification; standings below bracket map on area pages.
- Admin dynamism intentionally lower (forms > motion) — **maintain** unless adding publish celebrations.

---

## Journey maps

### A. Public — National Competitions (June)

```
/ → HomeStandingsPreview (phase-wide) → View standings
  → /june/{region} → StandingsContextBar → GamifiedLeaderboard → collapsed progress
```

**Maintain:** competition-map-driven CTA, sticky context bar, anticipation empty states.

### B. Public — Sword Duels

```
/ or nav → /sword-duels → /sword-duels/[area]
  → split panel → schedule → bracket map → standings (bottom)
/sword-duels/nationals → wildcard + knockout phases
/sword-duels/tv → rotator modes
```

**Improve candidate:** reorder area page so standings or live summary appears above fold.

### C. Admin — Setup (HRIS → Reps)

```
/admin → HRIS → branches CSV → employees (Gemini/screenshots)
  → profile drawer (rep assign) OR Representatives table
  → SD sync from branches → score areas
```

**Improve candidate:** single “Event readiness” strip on HRIS dashboard.

### D. Admin — Weekly (Revalida NC)

```
/admin → Revalida → National Competitions → Rounds → publish
  → Advancement lock at phase end
```

**Maintain:** phase status strip, confirm panels, post-publish checklist.

---

## Friction register (all products)

### P0 — Wrong outcome / blocked

| ID | Finding | Status |
|----|---------|--------|
| — | No code-path P0 identified in this audit | Verify prod migrations 016/019/020/027–033 applied |

### P1 — Confusion / extra taps

| ID | Finding | Route / file | Recommendation options |
|----|---------|--------------|------------------------|
| **J-P1-SD1** | Area **standings below bracket map** | `/sword-duels/[area]` | **A)** Move standings up **B)** Sticky mini-leaderboard **C)** Keep (spectacle-first) |
| **J-P1-HOME1** | Public nav has **3 items** (Home, SD, Rules) — NC standings not in nav | `PublicNav.tsx` | **A)** Keep (home CTA primary) **B)** Seasonal 4th tab **C)** Merge SD+Home when SD featured |
| **J-P1-HOME2** | Programs strip links `/june` redirect vs map-resolved href | Home | **A)** Use `resolvePublicStandingsHref()` **B)** Keep redirect |
| **J-P1-HOME3** | SD featured: duplicate journey (hero + journey bar) | `/` | **A)** Collapse to one **B)** Keep both for emphasis |
| **J-P1-HRIS1** | Dual rep assignment paths | HRIS + Representatives | **A)** Dashboard progress **B)** Document one primary path |
| **J-P1-HRIS2** | No employee CSV import | HRIS employees | **A)** Add CSV **B)** Screenshot-only + docs |
| **J-P1-HRIS3** | Save profile closes drawer | `EmployeeProfileModal` | **A)** Save & stay **B)** Keep close-on-save |
| **J-P1-ADM1** | SD admin 3+ nav hops to score | `/admin` → … → area | **A)** “Resume scoring” shortcut **B)** Accept depth |
| **J-P1-ADM2** | NC admin lacks deep “live board” link | NC layout | **A)** Mirror SD “Public board” **B)** Home link only |
| **J-P1-ADM3** | Stale copy: SD dashboard branch import path | `/admin/sword-duels` | **A)** Fix to HRIS **B)** — |
| **J-P1-PUB1** | Migration filenames in public error copy | `/sword-duels/nationals` | **A)** User-friendly message **B)** — |

### P2 — Polish

| ID | Finding | Options |
|----|---------|---------|
| J-P2-SD1 | Flat area hub grid (14+ areas) | Search/filter on hub |
| J-P2-SD2 | Long nationals scroll | Already collapsible — tune defaults |
| J-P2-HRIS1 | Stats not clickable | Click → filter |
| J-P2-HRIS2 | Import preview 10-row cap | “Show all” expand |
| J-P2-ADM1 | SD admin no InfoTips | Port NC pattern |
| J-P2-PUB1 | `/mechanics` vs `/sword-duels/mechanics` | Cross-link banners |

---

## Strengths to maintain (do not regress)

1. **HRIS / Revalida hub split** — plain language, distinct color roles.
2. **NC public standings-first** — `StandingsContextBar` + table + collapsed stats.
3. **Competition map → standings href** on home (not export-driven).
4. **SD gamification** — journey bar, green/purple phase colors, TV modes, rep names on hub.
5. **Admin confirm panels** — no browser `confirm()` on destructive ops.
6. **Publish pipeline guards** — participants, draft vs published separation.
7. **Wide employee profile drawer** — desktop-first, sectioned, prev/next.
8. **Gemini bulk roster import** — multi-image merge + preview.
9. **Neon-glass system** — `sd-*` primitives, glass nav, no admin on public.
10. **Anticipation empty states** — not failure tone.

---

## Hierarchy audit (what should be loudest)

| Surface | Should be #1 | Today | Verdict |
|---------|--------------|-------|---------|
| Home (NC featured) | Live standings preview + CTA | ✓ | **Keep** |
| Home (SD featured) | Area progress + enter duels | Hero + bar duplicate | **Consider trim** |
| `/june/{region}` | Leaderboard table | ✓ | **Keep** |
| `/sword-duels/[area]` | Who’s leading groups | Bracket map | **Consider promote standings** |
| HRIS employees | Directory table | Import block above fold | **OK for setup phase** |
| NC admin dashboard | Phase status + score CTA | ✓ | **Keep** |
| HRIS dashboard | Setup progress | Two static cards only | **Consider add metrics** |

---

## Interactivity & dynamism

| Pattern | Where it works | Gap |
|---------|----------------|-----|
| Collapsible secondary detail | NC boards, SD knockout | — |
| Sticky context / footer actions | NC bar, round editor, profile drawer | Branches roster save bar |
| Keyboard navigation | Rep drawer, employee drawer | Representatives mobile |
| Live refresh after mutation | `router.refresh()` | Open modals can show stale nested state |
| Motion / glow | SD public maps | Admin intentionally static — **OK** |
| Progress indicators | Publish panel, phase strip | HRIS import lacks per-file progress |

---

## Recommended decision batches (you choose)

### Batch 1 — Quick wins (low effort) ✅ shipped 2026-06-10

- [x] Fix SD dashboard copy → HRIS branches (area scoring empty state)
- [x] User-friendly nationals migration errors (`public-setup-messages.ts`)
- [x] Update `HRIS_NAV_HINTS` + workflow cards + HRIS dashboard for profile rep assign
- [x] Refresh employee in drawer after rep assign (`rep_assignments` from actions + live override)

### Batch 2 — Operator throughput (medium) ✅ shipped 2026-06-10

- [x] HRIS dashboard: branches / employees / rep coverage stats (`HrisSetupProgress`, `getHrisSetupOverview`)
- [x] “Save & stay” + “Save & next” on profile drawer (edit mode stays open; next when filtered list has more)
- [x] NC admin “View live board” deep link (`resolvePublicStandingsHref` in NC layout)
- [x] SD admin “Resume last area” on dashboard (`getLastSdScoredArea` + area slug link)
- [x] Bonus: `?filter=not_rep` on HRIS employees from “Needs Rep 1” stat card

### Batch 3 — Public scan path (medium, product decision) ✅ shipped 2026-06-10

- [x] `/sword-duels/[area]`: sticky group leaders bar + standings moved above schedule/bracket (`AreaGroupStickySummary`, `prominent` standings)
- [x] Home Programs strip NC card → `resolvePublicStandingsHref(mapConfig)` (not bare `/june`)
- [x] SD featured home: one journey UI — step pills embedded in `HomeSdHero`; duplicate `SdPublicJourneyBar` block removed

### Batch 4 — Structural (higher effort) ✅ shipped 2026-06-10

- [x] Employee CSV import UI (`ImportEmployeesCsv` → existing `importEmployeesFromCsv` + template download)
- [x] Searchable branch combobox (`BranchCombobox` in profile drawer + rep assignment panel)
- [x] URL-persisted admin filters (`useAdminUrlFilters` on employees, branches, representatives tables)
- [ ] Per-competition rep slots in DB — **deferred** until Quiz Day needs different reps than shared `branches` columns (documented in `competition-rep-programs.ts`)

---

## Audit method

1. Walked personas on code paths (public site, admin hub, HRIS, NC, SD).
2. Scored seven dimensions per [audit-rubric.md](./audit-rubric.md).
3. Cross-checked against skill rules in public-viewer-journey and journey-audit.md.
4. Validated recent HRIS changes (drawer, Gemini, rep panel) against live files.

**Next audit trigger:** After owner picks Batch 1–4 items, or major HRIS/SD public layout change.
