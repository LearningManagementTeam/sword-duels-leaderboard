# Admin reference — routes, actions, audit log

## Route inventory

| Route | Purpose | Key components |
|-------|---------|----------------|
| `/admin/login` | Password login | `login/page.tsx`, `actions/auth.ts` |
| `/admin` | Dashboard, export hash, workflow cards | `AdminWorkflowCards`, `ExportStandingsPanel` |
| `/admin/branches` | June CSV import (130+) | `ImportParticipatingBranches` |
| `/admin/representatives` | Edit rep names | `RepresentativesEditor` |
| `/admin/rounds` | Round list | `getAdminDashboard` |
| `/admin/rounds/[id]` | Score + publish | `RoundResultsForm` |
| `/admin/rounds/[id]/advances` | Committee picks | `ManualAdvancementPicks` |
| `/admin/advancement` | Lock June / July | `PhaseLockPanel` |
| `/admin/competition` | Home journey map | `CompetitionMapEditor` |
| `/admin/mechanics` | Public how-to copy | `MechanicsEditor` |
| `/admin/branding` | Logo, carousel, sponsor logos | `BrandingEditor` |
| `/admin/preview` | Links to sample boards | static links |
| `/admin/audit` | Audit log | `AuditLogFilters` |
| `/admin/export` | CSV export | `ExportStandingsPanel` |
| `/admin/system` | Stack / migrations | static |

## API routes (admin-auth required)

| Route | Purpose |
|-------|---------|
| `GET /api/export/[season]` | Published standings CSV |
| `POST/DELETE /api/admin/branding/carousel` | Home photo carousel |
| `POST/DELETE /api/admin/branding/sponsor-logos` | Partner logo strip |

## Audit log action names

Filters use `ilike 'prefix%'`. Prefix must match these exactly:

| Filter label | Prefix | Full action examples |
|--------------|--------|----------------------|
| Publish round | `publish_round` | `publish_round` |
| Save round (draft) | `save_round_results` | `save_round_results` |
| Competition map | `save_competition_map` | `save_competition_map` |
| Branding (logo) | `upload_branding_logo` | `upload_branding_logo`, `remove_branding_logo` |
| Branding (carousel) | `upload_carousel_slide` | `upload_carousel_slide`, `remove_carousel_slide` |
| Branding (partner logos) | `upload_sponsor_logo` | `upload_sponsor_logo`, `remove_sponsor_logo` |
| Imports | `import_` | `import_june_participants`, `import_branches`, `import_representatives` |
| Lock phase | `lock_phase` | `lock_phase` |
| Manual advances | `save_manual_advances` | `save_manual_advances` |
| Mechanics content | `save_mechanics_content` | `save_mechanics_content` |
| Representatives table | `save_representatives` | `save_representatives` |

## Migrations (admin system page should list)

| File | Note |
|------|------|
| 001_initial_schema.sql | Core tables |
| 003_branch_representatives.sql | Rep columns |
| 004_round_elimination.sql | Elimination columns |
| 005_manual_round_advances.sql | Committee picks |
| 006_site_content.sql | Mechanics content |
| 007_branding_storage.sql | Branding bucket |
| 008_tie_breaker_status.sql | Tie-breaker status |
| 010_competition_map.sql | Competition map |
| 011_branding_bucket_public.sql | Public carousel read |
| 012_round_finish_order.sql | R3 finish order |
| 013_manually_advanced_after_round.sql | Committee badge on standings |
| 014_carousel_four_slots.sql | 4 carousel slots, 3MB limit |
| 015_sponsor_logos.sql | 3 partner logo slots |

## Participant counts (expected)

| Phase | Source | Count |
|-------|--------|-------|
| June R1 | All `branches` | ~135 |
| June R3 survivors → July | `lockPhaseAndAdvance(june)` | 24 (8×3 regions) |
| July R3 → Nationals | `lockPhaseAndAdvance(july)` | 3 champions |
| Regional board display | Filter `region_filter` | Luzon 57, NCR 49, VisMin 29 at start |
