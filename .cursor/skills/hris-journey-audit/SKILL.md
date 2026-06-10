---
name: hris-journey-audit
description: >-
  HRIS admin journey audit — branches master list, employee directory, Gemini
  roster import, profile drawer, home branch vs rep assignment, and handoff to
  Revalida Representatives. Use when changing /admin/hris, employee profile
  modal, import flows, or operator setup before competitions.
---

# HRIS — Customer journey audit

**Latest snapshot:** [findings-2026-06-10.md](findings-2026-06-10.md)

**Related:** [sword-duels-admin/journey-audit](../sword-duels-admin/journey-audit.md), [public-viewer-journey](../public-viewer-journey/SKILL.md), [beginner-friendly-guide](../beginner-friendly-guide/SKILL.md)

## Persona

Central HR/ops on **desktop laptop**. Sets up ~135 branches and employee profiles **before** Revalida scoring and Sword Duels brackets. Non-developer; may paste from Excel or upload roster screenshots.

**Success =** branches imported → employees in directory with photos → reps assigned (max 2 per branch) → Revalida/SD public boards show correct names.

## Canonical journey

| Phase | Route | Primary surfaces |
|-------|-------|------------------|
| Hub | `/admin` | `AdminHubMenu` — HRIS vs Revalida |
| HRIS home | `/admin/hris` | `HrisWorkflowCards` |
| Branches | `/admin/hris/branches` | `BranchesRosterEditor`, `ImportParticipatingBranches` |
| Employees | `/admin/hris/employees` | `ImportEmployeesRosterVision`, `EmployeesDirectoryEditor`, `EmployeeProfileModal` |
| Rep slots (branch view) | `/admin/national-competitions/representatives` or `/admin/sword-duels/representatives` | `RepresentativesEditor` |
| Rep slots (employee view) | Profile drawer → Competition representative | `EmployeeRepAssignmentPanel` |

## Data model (operator mental model)

| Concept | Storage | UI label |
|---------|---------|----------|
| Master branch | `branches` | HRIS → Branches |
| Employee profile | `employees` | HRIS → Employee directory |
| Home / work branch | `employees.home_branch_id` | Profile → Work location |
| Competition rep | `branches.representative_1/2_*` | Profile → Rep 1/2 **or** Representatives table |
| Competition program | Shared slots today | UI shows **Sword Duels** only; same slots feed Revalida |

## Non-negotiable checks

- [ ] **135 branches** in master list before event (`data/branches.csv` or CSV import).
- [ ] **Home branch ≠ rep** — copy must not imply import assigns reps.
- [ ] **Gemini import** requires `GEMINI_API_KEY`; model default `gemini-2.5-flash` (2.0 shut down 2026-06-01).
- [ ] **Rep assign** from profile uses `assignEmployeeRepSlotAction`; max 2 per branch.
- [ ] **Profile drawer** desktop: full-height `max-w-5xl` right panel; prev/next through filtered list.
- [ ] **Photo** via `/api/hris/employee-photo`; appears on public SD boards when linked as rep.

## Friction register (2026-06-10)

### P0

| ID | Finding | Location |
|----|---------|----------|
| HRIS-P0-1 | Dual rep paths without unified dashboard progress | Profile drawer vs `RepresentativesEditor` |
| HRIS-P0-2 | Import sets home branch only — operators assume reps done | `ImportEmployeesRosterVision`, page copy |
| HRIS-P0-3 | Stale rep list in open drawer after assign (until close/refresh) | `EmployeeRepAssignmentPanel` + modal props |

### P1

| ID | Finding | Location |
|----|---------|----------|
| HRIS-P1-1 | No employee CSV bulk import (branches have CSV) | `ImportEmployeesDirectory` |
| HRIS-P1-2 | Save profile closes drawer — breaks multi-profile workflow | `EmployeeProfileModal.finishSuccess` |
| HRIS-P1-3 | Branch pickers: filter + native select at 135 rows | Profile + rep panel |
| HRIS-P1-4 | `HRIS_NAV_HINTS` outdated (no Gemini, rep assign, photos) | `admin-action-hints.ts` |
| HRIS-P1-5 | Branches rep column read-only; footer link only to NC Representatives | `BranchesRosterEditor` |

### P2

| ID | Finding | Location |
|----|---------|----------|
| HRIS-P2-1 | Stats cards not clickable → filters | `EmployeesDirectoryEditor` |
| HRIS-P2-2 | Import preview capped at 10 rows | `ImportEmployeesRosterVision` |
| HRIS-P2-3 | No URL-persisted search/filter | Directory + branches editors |

## Strengths to keep

1. Hub split HRIS / Revalida (`AdminHubMenu`).
2. Wide profile drawer with sections + keyboard prev/next.
3. Gemini multi-screenshot merge import.
4. Rep assignment from employee profile (Sword Duels label).
5. Explicit home branch vs rep separation in schema and copy.
6. Photo paste/upload workflow in drawer sidebar.

## Recommended sprint options (owner decides)

| Option | Effort | Impact |
|--------|--------|--------|
| A. HRIS dashboard **setup progress** (branches / employees / reps %) | Medium | High — single “am I ready?” view |
| B. **Save without closing** profile drawer | Low | High for bulk HR work |
| C. Employee **CSV import** parity with branches | Medium | High when no screenshots |
| D. Fix **stale drawer** after rep assign (refresh employee in modal) | Low | Medium |
| E. **Searchable branch combobox** (not native select) | Medium | Medium at 135 branches |
| F. Align all copy/hints to **employee-centric rep assign** | Low | Medium |

## Key files

| Area | Files |
|------|--------|
| Routes | `src/app/admin/(hris)/**` |
| Directory | `EmployeesDirectoryEditor.tsx`, `EmployeeProfileModal.tsx` |
| Import | `ImportEmployeesRosterVision.tsx`, `api/hris/extract-roster/route.ts` |
| Reps | `EmployeeRepAssignmentPanel.tsx`, `RepresentativesEditor.tsx` |
| Actions | `assignEmployeeRepSlotAction`, `importEmployeesFromDirectoryRows` in `admin.ts` |
| Hints | `src/lib/admin-action-hints.ts` |

## Regression after HRIS UX changes

- [ ] `npm run build`
- [ ] Import screenshot → preview → import → directory count updates
- [ ] Profile assign Rep 1 → visible on Representatives page + SD public
- [ ] Home branch edit does not auto-assign rep
- [ ] Gemini model env documented on Vercel
