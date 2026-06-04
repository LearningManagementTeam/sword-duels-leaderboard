# Admin customer journey & UI audit

Run when the user asks to audit admin UX, operator flow, or design consistency with the public site.

**Design references:** [sword-duels-neon-glass](../sword-duels-neon-glass/SKILL.md), [public-viewer-journey](../public-viewer-journey/SKILL.md) (inverse rules for admin).

## Operator persona

Central team member, non-developer. Opens admin weekly to score rounds, occasionally locks phases, updates home map/branding. Uses laptop; may use phone in a pinch at events.

**Success =** score → publish → fans see correct board in ≤3 intentional steps, with no fear of breaking the public site.

## Canonical journey (happy path)

| Phase | Steps | Primary surfaces |
|-------|-------|------------------|
| Setup (once) | Branches CSV → optional Reps → June R1 | `/admin/branches`, `/admin/representatives`, `/admin/rounds/[id]` |
| Weekly | Rounds → draft → preview → publish → optional picks → optional map | Dashboard cards, `/admin/rounds`, `/admin/rounds/[id]/advances`, `/admin/competition` |
| Phase end | Verify R3 boards → Advancement lock | `/admin/advancement` |
| Content | Mechanics, Branding (logo, carousel, partner logos) | `/admin/mechanics`, `/admin/branding` |
| Reporting | Export CSV, Audit log | Dashboard `#export`, `/admin/audit` |

## Design system alignment checklist

| Rule (neon-glass) | Public site | Admin today | Target |
|-------------------|-------------|-------------|--------|
| `sd-page-header` on all pages | Yes | **Branding** uses ad-hoc `text-2xl` | Unify |
| Semantic alerts: `sd-alert-warning`, `sd-alert-info` | Yes | Many inline `border-amber-*` / `bg-red-*` blocks | Consolidate |
| Primary CTA: `sd-btn-primary` / `SdButton` | Yes | Mix of raw classes + `SdButton` unused in admin | Prefer `SdButton` |
| Tie-breaker / committee: fuchsia accent | Yes | Partial (workflow card link only) | Extend to picks CTAs |
| `sd-neon-panel` for major sections | Yes | Yes | Keep |
| `SdDataTable` for tables | N/A | Audit log only; round/reps use raw `<table>` | Wrap heavy tables |
| Reduced motion respected | Yes | Yes (inherits globals) | Keep |
| Max ~2 taps to primary task | ≤2 nav taps | **Weekly score = 2** (Rounds → round) OK; **Dashboard tie card = 1** OK | Improve lock/publish discoverability |
| No duplicate navigation to same task | Public: 2 nav items | Dashboard: workflow cards **+** quick links **+** recent rounds | Dedupe |
| Actionable empty states | Public: anticipation copy | Mixed | Align tone |

## Journey friction register (audit 2025-06)

### P0 — Wrong outcome or blocked operator

| ID | Finding | Location |
|----|---------|----------|
| J-P0-1 | July/Nationals round editor can look "empty" without explaining **Lock & advance** first | `getRoundWithResults` + `RoundResultsForm` — gate banner added; needs dashboard **phase status** too |
| J-P0-2 | **11 flat nav pills** — no grouping; mobile wraps into wall of links | `AdminNav.tsx` |
| J-P0-3 | **Export** nav item uses `#export` hash — doesn't scroll from other pages; no active state on export | `AdminNav.tsx`, dashboard layout |

### P1 — Extra taps, confusion, inconsistent chrome

| ID | Finding | Location |
|----|---------|----------|
| J-P1-1 | Dashboard **Quick links** duplicate workflow cards | `page.tsx` |
| J-P1-2 | **Recent rounds** sorted by `round_number`, not recency — doesn't match "what happened last" | `getAdminDashboard` |
| J-P1-3 | Rounds list uses season **display name** string match (`includes("June")`) for picks link | `rounds/page.tsx` |
| J-P1-4 | No **breadcrumb / back** on round editor (advances page has back link) | `rounds/[id]/page.tsx` |
| J-P1-5 | **Browser `confirm()`** for publish, phase lock, carousel remove — off-brand, no progress | `RoundResultsForm`, `PhaseLockPanel`, `BrandingEditor` |
| J-P1-6 | Branding page subtitle omits **carousel (4)** and **partner logos (3)** | `branding/page.tsx` |
| J-P1-7 | Phase lock still says "seed into **August**" in confirm copy | `PhaseLockPanel.tsx` — should say **The Nationals** |
| J-P1-8 | Stat cards show raw counts — no **135 target**, no **24/3 lock expectation** | Dashboard |

### P2 — Polish & consistency

| ID | Finding | Location |
|----|---------|----------|
| J-P2-1 | Workflow card secondary CTAs use custom border classes instead of `sd-btn-secondary` / ghost | `AdminWorkflowCards.tsx` |
| J-P2-2 | `AdminCallout` duplicates `sd-alert-info` | `AdminCallout.tsx` |
| J-P2-3 | Round scoring table: `max-h-[60vh]` scroll only — no sticky header on long rosters | `RoundResultsForm.tsx` |
| J-P2-4 | Representatives editor: wide table, no mobile card fallback | `RepresentativesEditor.tsx` |
| J-P2-5 | Preview page good; no link from publish success to **live** board per region | `AdminOperationPanel` success detail |
| J-P2-6 | System page separated from nav — only in header; OK for IT but easy to miss | `layout.tsx` |
| J-P2-7 | `InfoTip` tooltip can clip off-screen on mobile | `InfoTip.tsx` |

## Admin vs public journey (intentional differences)

| Public rule | Admin inverse |
|-------------|---------------|
| Results first | **Action first** on dashboard (workflow cards before stats) |
| 2 nav destinations | Many destinations OK — but **group** into Operate / Content / System |
| No export/admin on public | Export + audit admin-only ✓ |
| Gamified celebration tone | Operator tone: clear verbs ("Publish", "Lock", "Seed") — already mostly good |
| Collapse secondary below fold | Collapse **help** (`InfoTip`, `details`) not primary actions |

## Sprint backlog (recommended order)

### Sprint 1 — Mission control dashboard ✅
- Phase status strip: June/July/Nationals, latest published round, lock state, participant counts (135 / 24 / 3).
- Dedupe: removed Quick links + stat cards; dashboard = status strip → workflow cards → recent activity.
- Export nav → `/admin/export` dedicated page.
- Recent rounds: sort by `published_at` / `created_at`, Live/Draft badges, cap 8.

### Sprint 2 — Navigation & wayfinding ✅
- Group `AdminNav`: Operate / Roster / Site / Tools (desktop labels + mobile horizontal scroll with edge fade).
- `AdminBreadcrumb` on round editor, advancement picks, branding.
- Branding section jump links + anchor ids on editor sections.

### Sprint 3 — Action patterns ✅
- `AdminConfirmPanel` replaces browser `confirm()` for publish, phase lock, carousel remove.
- Publish: inline confirm with warnings, then `AdminOperationPanel` progress.
- Phase lock: danger-tone confirm with seed counts; success/error via `sd-alert-info` / `sd-alert-warning`.
- Carousel remove: inline confirm per slot.

### Sprint 4 — Design system cleanup ✅
- All admin panel pages use `sd-page-header` (including System).
- `AdminCallout` wraps `sd-alert-info`.
- Workflow cards use `SdButtonLink` (primary / ghost / fuchsia).
- Rounds list grouped by season slug + `seasonPhaseLabel`; advancement link via `usesPerRoundElimination`.
- Nationals naming in advancement copy and phase lock descriptions.

### Sprint 5 — High-friction forms ✅
- Round editor: sticky save/publish bar; sticky table header with backdrop; `SdButtonLink` for advancement picks.
- Representatives: mobile card layout (`md:hidden`); table from `md` up with sticky header.
- Manual advancement: `{n} of 3 regions saved` progress + checkmarks on region tabs.

### Sprint 6 — Copy & parity pass ✅
- `AdminPostPublishChecklist` after publish (live board, map, picks, TV).
- `AdminEmptyState` for dashboard, audit, empty round roster.
- Anticipation-tone copy on advancement picks empty region.
- Preview page labels The Nationals; admin surfaces use `seasonPhaseLabel` (no raw “August” in UI copy).

## Regression checks after each sprint

- [ ] `npm run build`
- [ ] Weekly path: Dashboard → Rounds → publish still ≤3 clicks
- [ ] Lock path: Advancement visible from gate banner + dashboard phase strip
- [ ] No new public-surface leaks (export, admin links)
- [ ] Neon-glass: no new raw slate/white chrome; amber only in alert primitives
