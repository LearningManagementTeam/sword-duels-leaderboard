---
name: sword-duels-admin
description: >-
  Sword Duels Leaderboard admin panel — auth, CSV import, rounds publish,
  advancement picks, phase lock seeding, competition map, branding, audit log,
  CSV export. Use when changing /admin routes, admin.ts actions, admin-queries,
  operator workflows, or diagnosing admin bugs (July roster, phase lock, publish).
---

# Sword Duels — Admin operations

Read **[reference.md](reference.md)** for route inventory, audit action names, and audit checklist.

For **operator journey + UI consistency audits** → [journey-audit.md](journey-audit.md) (sprint backlog).

For owner-facing steps → [beginner-friendly-guide](../beginner-friendly-guide/SKILL.md) + [docs/DAILY-OPERATIONS.md](../../docs/DAILY-OPERATIONS.md).

For public site rules → [public-viewer-journey](../public-viewer-journey/SKILL.md).

For schema/migrations → [sword-duels-supabase](../sword-duels-supabase/SKILL.md).

## Non-negotiable invariants

1. **June (`june_area`)** — All branches in `branches` table compete. Regional boards filter by `region`; **57 on Luzon ≠ total import** (135 = Luzon 57 + NCR 49 + VisMin 29).
2. **July (`july_region`)** — Only branches in `season_participants` after **Lock & advance June**. Expect **24**. Never publish July with empty participants (guard in `assertSeasonParticipantsReady`).
3. **Nationals (`august_finals`)** — Only `season_participants` after **Lock & advance July**. Expect **3** regional champions.
4. **Publish** — `publishRound` → `recomputeAndPublishStandings` → `published_standings`. Public site reads published rows only.
5. **Phase lock** — `lockPhaseAndAdvance` requires R3 published; seeds next season's `season_participants`. Re-lock wipes/re-seeds — warn in UI.

## Operator sequence (weekly)

1. **Branches** — CSV UTF-8 import (130+ rows) → Admin → Branches → Import for June Round 1.
2. **Representatives** — Table edit (Admin → Representatives) or optional rep columns in import CSV.
3. **Round** — Admin → Rounds → enter scores → Save draft → Preview (optional) → **Save & publish** (progress panel).
4. **Tie-breakers** — After publish, branches tied at cut show **Tie breaker** on public board → Admin → round → **Advancement picks**.
5. **Competition map** — After major beats, Admin → Competition map → milestone + caption (list auto-refreshes from publish).
6. **End of phase** — Publish R3 all regions → Admin → **Advancement** → Lock & advance → verify seed counts (24 / 3).

## Auth layers

| Layer | File | Notes |
|-------|------|-------|
| Edge | `src/middleware.ts` | `/admin/*` except login; checks `admins` table |
| Layout | `src/app/admin/(panel)/layout.tsx` | `requireAdminEmail()` |
| Actions/API | `src/lib/admin-auth.ts` | Service role for writes |
| Export/branding API | `/api/export/*`, `/api/admin/branding/*` | Not in middleware; each calls `requireAdminEmail()` |

## Key code map

| Area | Files |
|------|-------|
| Actions | `src/lib/actions/admin.ts` |
| Admin reads | `src/lib/data/admin-queries.ts` |
| Participants | `src/lib/season-participants.ts` |
| Scoring | `src/lib/scoring.ts`, `src/lib/scoring-config.ts` |
| CSV import | `src/lib/branches-csv.ts`, `ImportParticipatingBranches.tsx` |
| Publish UX | `RoundResultsForm.tsx`, `AdminOperationPanel.tsx`, `AdminPostPublishChecklist.tsx` |
| Phase lock | `PhaseLockPanel.tsx`, `getPhaseLockOverview()` |

## Admin audit process (run when user asks to audit admin)

Do not skip steps. Record findings as P0/P1/P2.

### 1. Participant seeding

- [ ] `season_participants` counts: June N/A (all branches), July 24 after lock, Nationals 3 after lock.
- [ ] `resolveParticipantBranchIds` / `assertSeasonParticipantsReady` used on publish + round forms.
- [ ] Publishing July/Nationals with 0 participants is **blocked** server-side.

### 2. Round publish pipeline

- [ ] `saveRoundResults` draft does not touch public standings.
- [ ] `publishRound` validates participants **before** setting `status = published`.
- [ ] `recomputeAndPublishStandings` writes per-region rows for June/July.
- [ ] Admin publish UI shows step progress (`AdminOperationPanel`).

### 3. Dashboard & navigation

- [ ] Tie-breaker card links to **latest by `published_at`**, not last row in `round_number` sort.
- [ ] Audit log filter prefixes match `logAudit` action strings (see reference.md).

### 4. Import integrity

- [ ] June import upserts 130+ rows; seeds `round_results` for **imported** branches only.
- [ ] CSV: quoted commas, regions `luzon` | `ncr` | `vismin` only.

### 5. Content & branding

- [ ] Slugs: `branding`, `competition_map`, `mechanics_public` in `site_content`.
- [ ] Branding storage allowlist includes `sponsor-logo-[1-3].*` paths.
- [ ] Carousel 4 slots; sponsor logos 3 slots; revalidate home after upload.

### 6. Docs alignment

- [ ] `docs/DAILY-OPERATIONS.md` matches UI (sponsor logos, lock-before-July, regional counts).
- [ ] Admin → System migration list includes latest files (014, 015, …).

### 7. Regression build

- [ ] `npm run build` passes after admin changes.

## Common misreadings (explain to owner)

| Symptom | Cause |
|---------|--------|
| "Only 57 branches imported" | Viewing **Luzon regional board**; total is 135 across 3 regions |
| July R1 shows 57 per region | June not locked — full branch pool still used (**fixed by participant guards**) |
| Home roster empty but July published | Competition map milestone still on June — sync map or mismatch banner |
| Partner logos broken after upload | `branding-storage.ts` allowlist must include `sponsor-logo-*` |

## When fixing admin bugs

- Prefer **server-side guards** over UI-only warnings for data integrity.
- Keep operator messages actionable ("Go to Admin → Advancement → Lock & advance June").
- Log audit entries for destructive actions; match filter prefix strings exactly.
