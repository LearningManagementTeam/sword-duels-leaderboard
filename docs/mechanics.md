# Sword Duels — Competition Mechanics (v2)

This document defines the scoring and advancement rules encoded in the leaderboard.
Update [`src/lib/scoring-config.ts`](../src/lib/scoring-config.ts) when official mechanics change.

## Phases

| Phase | Season | Participants | Rounds | Advancement |
|-------|--------|--------------|--------|-------------|
| June | `june_area` | All branches (130+) | 3 weekly rounds | **8 per region** after R3 → **24** to July |
| July | `july_region` | 24 from June (8 per region) | 3 weekly rounds per region | **1 champion per region** → The Nationals |
| The Nationals | `august_finals` | 3 regional champions | 3 rounds (one day) | **1 overall champion** |

## June — per-round regional elimination

Each round uses **that round’s score only** (not cumulative). Within each region:

| After round | Luzon | NCR | VisMin | Total survivors |
|-------------|-------|-----|--------|-----------------|
| Round 1 | top 32 | top 32 | top 32 | **96** |
| Round 2 | top 16 | top 16 | top 16 | **48** |
| Round 3 | top 8 | top 8 | top 8 | **24** → July |

### June round formats

| Round | Format | Scoring |
|-------|--------|---------|
| Round 1 | Bingo Phallanx — 10-question quiz | 0–10 points; top 32 per region advance |
| Round 2 | Last KaBingoPlus Standing | Survived / Out; exactly 16 per region advance |
| Round 3 | Clash of the Knowledge Swords | First to 5 correct; finish order 1–8; top 8 per region advance |

## July — per-round regional elimination

Starting pool: **8 per region** (24 total from June). Same *shape* as June (quiz → survival → race) with regional stakes and extra elements.

| After round | Per region | Total survivors |
|-------------|------------|-----------------|
| Round 1 | top 4 | **12** |
| Round 2 | top 2 | **6** |
| Round 3 | top 1 | **3** → The Nationals |

### July round formats

| Round | Format | Scoring |
|-------|--------|---------|
| Round 1 | 15-item quiz | 0–15 points; **highest scores** fill the top 4 spots per region |
| Round 2 | Triple heart survival | **0–3 hearts** remaining per branch; last **2 standing** per region advance (0 hearts = out) |
| Round 3 | First to 5 correct | Same as June R3; **regional champion** advances to The Nationals |

## The Nationals — one-day cumulative contest

Three regional champions compete in a **scored 3-round contest**. Round scores are **percentages (0–100)** that **sum cumulatively** for the championship board.

| Round | Format | Scoring |
|-------|--------|---------|
| Round 1 | Lifelines challenge | 0–100%; perfect run = all **3 lifelines** kept with **no wrong-answer deductions** |
| Round 2 | Roleplay round | SME judges: **Right 100%**, **Incomplete 50%**, **Wrong 0%** |
| Round 3 | Q&A finals | Miss Universe–style Q&A; **3 judges**; same **100 / 50 / 0** scale |

Overall champion = highest **total %** after all three rounds.

## Tie-breakers (within a round, for elimination cuts)

1. Higher **round points**
2. Higher **wins in that round**
3. **Branch name** (A–Z)

Only the top **N** per region advance automatically (see tables above). Ties at the cut line may require committee tie-breaker picks or manual advancement.

## Manual extra advancement (committee picks)

When many branches score the maximum but only **N** advance per region automatically:

1. Publish the round as usual (automatic cut applies).
2. Admin → **Rounds** → that round → **Manage advancement picks**.
3. Choose region, check extra branches, **Save**.

## Status labels

| Status | Meaning |
|--------|---------|
| `active` | Still competing — advancing to next round |
| `advanced` | Survived June R3 (8 per region) |
| `eliminated` | Out after a specific round |
| `regional_finalist` | Won July R3 in their region |
| `champion` | The Nationals winner |

## Draft vs published

- Admins save round results as **draft**.
- **Publish** applies elimination for that round and updates the public leaderboard.
- Only **published** rounds trigger elimination publicly.
