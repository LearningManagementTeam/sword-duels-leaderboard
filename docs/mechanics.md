# Sword Duels — Competition Mechanics (v1)

This document defines the default scoring and advancement rules encoded in the leaderboard.
Update `src/lib/scoring-config.ts` when official mechanics change.

## Phases

| Phase | Season | Participants | Rounds | Advancement |
|-------|--------|--------------|--------|-------------|
| June | `june_area` | All branches (130+) | 3 (R1, R2, R3) | Top **24** by cumulative points |
| July | `july_region` | 24 survivors | 3 per region track | **1 champion per region** (Luzon, NCR, Vismin) |
| August | `august_finals` | 3 regional champions | Finals rounds | **1 overall champion** |

## Scoring (per round)

Admins enter per branch, per round:

- **Points** (primary) — main metric for ranking
- **Wins** / **Losses** (secondary, for display and tie-breakers)

**Season total** = sum of published round points for that season.

## Tie-breakers (in order)

1. Higher **total points**
2. Higher **Round 3** points (latest round)
3. Higher **Round 2** points
4. Higher **total wins**
5. **Branch name** (A–Z) — deterministic fallback

## Status labels

| Status | Meaning |
|--------|---------|
| `active` | Still competing in current phase |
| `advanced` | In advancement zone (e.g. top 24 in June) |
| `eliminated` | Did not advance after phase lock |
| `regional_finalist` | Won regional slot (July) |
| `champion` | August winner |

## Draft vs published

- Admins save round results as **draft**.
- **Publish** recomputes standings and updates the public leaderboard.
- Public site only reads **published** data.

## Forfeits / no-shows

Enter **0 points** for the round; optional note in admin audit log.
