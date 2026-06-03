# Sword Duels — Competition Mechanics (v2)

This document defines the scoring and advancement rules encoded in the leaderboard.
Update [`src/lib/scoring-config.ts`](../src/lib/scoring-config.ts) when official mechanics change.

## Phases

| Phase | Season | Participants | Rounds | Advancement |
|-------|--------|--------------|--------|-------------|
| June | `june_area` | All branches (130+) | 3 weekly rounds | **8 per region** after R3 → **24** to July |
| July | `july_region` | 24 from June | 3 weekly rounds per region | **1 champion per region** → August |
| August | `august_finals` | 3 regional champions | Finals (format TBD) | **1 overall champion** |

## June — per-round regional elimination

Each round uses **that round’s score only** (not cumulative). Within each region:

| After round | Luzon | NCR | VisMin | Total survivors |
|-------------|-------|-----|--------|-----------------|
| Round 1 | top 32 | top 32 | top 32 | **96** |
| Round 2 | top 16 | top 16 | top 16 | **48** |
| Round 3 | top 8 | top 8 | top 8 | **24** → July |

Eliminated branches do **not** compete in later rounds. The public board shows **—** for rounds they did not play.

## July — per-round regional elimination

Starting pool: **8 per region** (24 total from June).

| After round | Per region | Total survivors |
|-------------|------------|-----------------|
| Round 1 | top 4 | **12** |
| Round 2 | top 2 | **6** |
| Round 3 | top 1 | **3** → August |

## August

Three regional champions compete in a single-day event. Scoring format to be confirmed separately.

## Tie-breakers (within a round, for elimination cuts)

1. Higher **round points**
2. Higher **wins in that round**
3. **Branch name** (A–Z)

## Status labels

| Status | Meaning |
|--------|---------|
| `active` | Still competing — advancing to next round |
| `advanced` | Survived June R3 (8 per region) |
| `eliminated` | Out after a specific round (see badge: “Eliminated — R1”) |
| `regional_finalist` | Won July R3 in their region |
| `champion` | August winner |

## Draft vs published

- Admins save round results as **draft**.
- **Publish** applies elimination for that round and updates the public leaderboard.
- Only **published** rounds trigger elimination. Draft scores do not eliminate anyone publicly.

## Forfeits / no-shows

Enter **0 points** for the round; the branch can still be eliminated if others score higher.
