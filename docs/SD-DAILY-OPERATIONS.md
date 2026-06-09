# Sword Duels — daily operations

For **National Competitions** (June / July / August regional boards), use [DAILY-OPERATIONS.md](./DAILY-OPERATIONS.md) and **Admin → National Competitions**.

This guide is for **Sword Duels area tournaments + nationals** only — **Admin → Sword Duels**.

## Two admin panels (do not confuse)

| Panel | URL | Use for |
|-------|-----|---------|
| **National Competitions** | `/admin/national-competitions` | June/July/August branch leaderboards, phase lock, CSV import for 135 branches |
| **Sword Duels** | `/admin/sword-duels` | Area group brackets, area finals, nationals wild card + knockout |

**Branch CSV import** lives under National Competitions → Branches. Sword Duels reads those branches — sync brackets after import.

## Admin pages (Sword Duels)

| Page | Use for |
|------|---------|
| **Dashboard** | Area list + status, **tournament format** (V1 or V2), group sort |
| **Areas** | Score and publish Group A, Group B, area final per area |
| **Representatives** | Two reps per branch (CSV or table) |
| **Brackets** | Read-only bracket structure |
| **Regionals** | *(Version 2 only)* Three rounds per Luzon / NCR / VisMin |
| **Nationals** | V1: wild card + knockout · V2: finals bracket only |
| **Mechanics** | Public copy for `/sword-duels/mechanics` |

Public site: `/sword-duels` · TV: `/sword-duels/tv` · Nationals TV: `/sword-duels/tv?mode=nationals`

## Tournament format (pick once)

On **Dashboard**, choose **Version 1** or **Version 2** before any set is published. After the first publish, the format is locked.

| Format | After area finals |
|--------|-------------------|
| **V1 (classic)** | Wild card slot 16 → 16-slot knockout |
| **V2 (regional average)** | 3 rounds per region (average standings) → semifinal + final |

Migration: `030_sd_tournament_format.sql`

## One-time setup

1. **National Competitions → Branches** — import combined CSV (branches + optional reps).
2. **Sword Duels → Dashboard** — confirm areas appear. If empty, run migration `016_sword_duels_repair.sql` in Supabase, then refresh.
3. **Sword Duels → Representatives** — verify rep names (re-import CSV or edit table).
4. **Supabase migrations** (if not already applied): `019_sd_nationals_wildcard.sql`, `020_sd_nationals_knockout.sql`, `030_sd_tournament_format.sql` — or re-run `016_sword_duels_repair.sql`.

## Weekly area scoring

For each area, in order:

1. **Admin → Sword Duels → Areas → [area]**
2. Enter scores → **Save draft** → **Publish set** for **Group A**
3. Same for **Group B**
4. Enter area final scores → **Publish set** for **Area final**

Publishing the area final **auto-syncs** nationals (V1: wild card roster · V2: regional participant lists).

**Unpublish warning:** Reverting an area final can reset nationals progress. Unpublish downstream knockout matches first if needed.

## Nationals — Version 1 (wild card + knockout)

### Wild card (slot 16)

Runs after **every area final is published**.

| Situation | What happens |
|-----------|----------------|
| One clear 2nd-highest loser score | Wild card auto-selected — no tiebreak |
| Multiple tied at 2nd-highest | **Tiebreak round** — score tied candidates, publish |

**Admin → Sword Duels → Nationals** — wild card map + scoring form.

### Knockout

Runs after **all area reps + wild card are locked**.

1. **Admin → Nationals** — click **Sync bracket** if Round of 16 matches are missing.
2. Score each R16 match → **Save draft** → **Publish match**.
3. Winners advance automatically to QF → SF → Final.

## Nationals — Version 2 (regionals + finals)

### Regional rounds

After area finals, **Admin → Regionals** — for each of Luzon, NCR, VisMin:

1. Score **Round 1** → publish → **Round 2** → publish → **Round 3** → publish.
2. Standings rank by **average** of published rounds; highest average is the regional champion.

### Finals bracket

When all three regions finish three published rounds:

1. **Admin → Nationals** — semifinal (Luzon vs NCR), then final (winner vs VisMin).
2. Score and publish each match.

Public map: `/sword-duels/nationals` · per-region: `/sword-duels/regionals/[region]`

## Event-day TV

| URL | Shows |
|-----|--------|
| `/sword-duels/tv` | Area brackets (optional 60s rotate) |
| `/sword-duels/tv?mode=nationals&rotate=60` | V1: wild card ↔ knockout · V2: regionals ↔ finals |
| `/sword-duels/tv?mode=event&rotate=90` | All areas, then nationals phase(s) for active format |

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| No areas on dashboard | Import branches in NC admin; run `016_sword_duels_repair.sql` |
| Sets not initialized | Dashboard message → sync/migration |
| Nationals page error | Run migrations 019 + 020 |
| Knockout empty after field locked | Admin → Nationals → **Sync bracket** |
| Wildcard wrong after unpublish | Re-publish area finals or **Sync** wild card from area finals |

## Audit checklist (before nationals night)

- [ ] All area finals published
- [ ] Wild card resolved (auto or tiebreak published)
- [ ] Knockout bracket synced
- [ ] Test publish one R16 match on staging
- [ ] TV URL bookmarked for venue displays
