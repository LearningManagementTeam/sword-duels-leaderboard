import type { BranchStatus, StandingRow } from "./types";
import type { Region, SeasonSlug } from "./scoring-config";
import { REGIONS, SCORING_CONFIG, usesPerRoundElimination } from "./scoring-config";
import {
  manualAdvancesForRound,
  type ManualAdvance,
} from "./manual-advances";

export interface BranchInput {
  id: string;
  branch_code: string;
  branch_name: string;
  area: string;
  region: Region;
}

export interface RoundPoints {
  round_number: number;
  points: number;
  wins: number;
  losses: number;
}

export interface ComputeStandingsOptions {
  filterRegion?: Region;
  /** Round numbers treated as published (trigger elimination). Defaults to all rounds present in results. */
  publishedRoundNumbers?: number[];
  /** Admin picks: extra branches that survive after a round's automatic cut. */
  manualAdvances?: ManualAdvance[];
}

interface BranchEliminationState {
  branch: BranchInput;
  eliminatedInRound: number | null;
  tieBreakerInRound: number | null;
  manuallyAdvancedAfterRound: number | null;
  roundScores: Map<number, RoundPoints>;
}

/** Apply regional survivor cut; marks tie-breaker when tied scores exceed available slots. */
function applyRegionalSurvivorCut(
  ranked: { branch: BranchInput; points: number }[],
  survivorCut: number,
  roundNum: number,
  state: Map<string, BranchEliminationState>,
  alive: Set<string>
) {
  if (ranked.length <= survivorCut) return;

  const cutoffPoints = ranked[survivorCut - 1].points;
  const aboveCut = ranked.filter((e) => e.points > cutoffPoints);
  const atCut = ranked.filter((e) => e.points === cutoffPoints);
  const belowCut = ranked.filter((e) => e.points < cutoffPoints);

  const autoSlotsAtCut = survivorCut - aboveCut.length;

  atCut.forEach((entry, idx) => {
    if (idx >= autoSlotsAtCut) {
      state.get(entry.branch.id)!.tieBreakerInRound = roundNum;
      alive.delete(entry.branch.id);
    }
  });

  for (const entry of belowCut) {
    state.get(entry.branch.id)!.eliminatedInRound = roundNum;
    alive.delete(entry.branch.id);
  }
}

function compareRoundEntry(
  a: { points: number; branch_name: string },
  b: { points: number; branch_name: string }
): number {
  if (b.points !== a.points) return b.points - a.points;
  return a.branch_name.localeCompare(b.branch_name);
}

function inferPublishedRounds(
  branches: BranchInput[],
  resultsByBranch: Map<string, RoundPoints[]>
): number[] {
  const rounds = new Set<number>();
  for (const branch of branches) {
    for (const r of resultsByBranch.get(branch.id) ?? []) {
      rounds.add(r.round_number);
    }
  }
  return [...rounds].sort((a, b) => a - b);
}

function roundPointsOrNull(
  lastActiveRound: number,
  roundNum: number,
  score: RoundPoints | undefined,
  publishedRounds: number[]
): number | null {
  if (roundNum > lastActiveRound) return null;
  if (!publishedRounds.includes(roundNum)) return null;
  return score?.points ?? 0;
}

function computePerRoundEliminationStandings(
  seasonSlug: "june_area" | "july_region",
  branches: BranchInput[],
  resultsByBranch: Map<string, RoundPoints[]>,
  options?: ComputeStandingsOptions
): StandingRow[] {
  const config = SCORING_CONFIG[seasonSlug];
  let pool = branches;
  if (options?.filterRegion) {
    pool = branches.filter((b) => b.region === options.filterRegion);
  }

  const publishedRounds =
    options?.publishedRoundNumbers?.slice().sort((a, b) => a - b) ??
    inferPublishedRounds(pool, resultsByBranch);

  const manualAdvances = options?.manualAdvances ?? [];

  const state = new Map<string, BranchEliminationState>();
  for (const branch of pool) {
    state.set(branch.id, {
      branch,
      eliminatedInRound: null,
      tieBreakerInRound: null,
      manuallyAdvancedAfterRound: null,
      roundScores: new Map(),
    });
  }

  let alive = new Set(pool.map((b) => b.id));
  let latestPublishedRound = 0;

  for (let roundNum = 1; roundNum <= config.roundCount; roundNum++) {
    if (!publishedRounds.includes(roundNum)) continue;
    latestPublishedRound = roundNum;

    for (const id of alive) {
      const rp = (resultsByBranch.get(id) ?? []).find(
        (r) => r.round_number === roundNum
      );
      if (rp) state.get(id)!.roundScores.set(roundNum, rp);
    }

    const survivorEntry = config.survivorsPerRound.find(
      (s) => s.round === roundNum
    );
    if (!survivorEntry) continue;

    for (const region of REGIONS) {
      const regionAlive = pool.filter(
        (b) => b.region === region && alive.has(b.id)
      );
      const survivorCut = survivorEntry.perRegion[region];

      const ranked = regionAlive
        .map((branch) => {
          const rp = state.get(branch.id)!.roundScores.get(roundNum);
          return {
            branch,
            points: rp?.points ?? 0,
          };
        })
        .sort((a, b) =>
          compareRoundEntry(
            {
              points: a.points,
              branch_name: a.branch.branch_name,
            },
            {
              points: b.points,
              branch_name: b.branch.branch_name,
            }
          )
        );

      applyRegionalSurvivorCut(ranked, survivorCut, roundNum, state, alive);

      const manual = manualAdvancesForRound(manualAdvances, roundNum, region);
      for (const branchId of manual) {
        const branch = pool.find((b) => b.id === branchId && b.region === region);
        if (!branch) continue;
        const s = state.get(branchId)!;
        if (
          s.eliminatedInRound === roundNum ||
          s.tieBreakerInRound === roundNum
        ) {
          s.eliminatedInRound = null;
          s.tieBreakerInRound = null;
          s.manuallyAdvancedAfterRound = roundNum;
          alive.add(branchId);
        }
      }
    }
  }

  const rows: StandingRow[] = pool.map((branch) => {
    const s = state.get(branch.id)!;
    const elim = s.eliminatedInRound;
    const tieBreak = s.tieBreakerInRound;
    const lastActiveRound = elim ?? tieBreak ?? latestPublishedRound;

    const r1Val = roundPointsOrNull(
      lastActiveRound,
      1,
      s.roundScores.get(1),
      publishedRounds
    );
    const r2Val = roundPointsOrNull(
      lastActiveRound,
      2,
      s.roundScores.get(2),
      publishedRounds
    );
    const r3Val = roundPointsOrNull(
      lastActiveRound,
      3,
      s.roundScores.get(3),
      publishedRounds
    );

    const played = [r1Val, r2Val, r3Val].filter((v) => v !== null) as number[];
    const total_points = played.reduce((sum, v) => sum + v, 0);
    const total_wins = [...s.roundScores.values()].reduce(
      (sum, r) => sum + r.wins,
      0
    );

    let status: BranchStatus = "active";
    if (tieBreak !== null) {
      status = "tie_breaker";
    } else if (elim !== null) {
      status = "eliminated";
    } else if (
      latestPublishedRound === config.roundCount &&
      publishedRounds.includes(config.roundCount)
    ) {
      status =
        seasonSlug === "july_region" ? "regional_finalist" : "advanced";
    }

    const advancing_to_round =
      elim === null &&
      tieBreak === null &&
      latestPublishedRound > 0 &&
      latestPublishedRound < config.roundCount
        ? latestPublishedRound + 1
        : null;

    return {
      branch_id: branch.id,
      branch_code: branch.branch_code,
      branch_name: branch.branch_name,
      area: branch.area,
      region: branch.region,
      rank: 0,
      total_points,
      round1_points: r1Val,
      round2_points: r2Val,
      round3_points: r3Val,
      total_wins,
      status,
      eliminated_in_round: elim,
      tie_breaker_in_round: tieBreak,
      last_active_round: lastActiveRound,
      advancing_to_round,
      latest_published_round: latestPublishedRound,
      manually_advanced_after_round: s.manuallyAdvancedAfterRound,
    };
  });

  rows.sort(compareStandingRows);
  rows.forEach((row, index) => {
    row.rank = index + 1;
  });

  return rows;
}

function computeCumulativeStandings(
  seasonSlug: SeasonSlug,
  branches: BranchInput[],
  resultsByBranch: Map<string, RoundPoints[]>,
  options?: ComputeStandingsOptions
): StandingRow[] {
  const config = SCORING_CONFIG[seasonSlug];
  let pool = branches;
  if (options?.filterRegion) {
    pool = branches.filter((b) => b.region === options.filterRegion);
  }

  const rows: StandingRow[] = pool.map((branch) => {
    const rounds = resultsByBranch.get(branch.id) ?? [];
    const byNum = new Map(rounds.map((r) => [r.round_number, r]));
    const r1 = byNum.get(1)?.points ?? 0;
    const r2 = byNum.get(2)?.points ?? 0;
    const r3 = byNum.get(3)?.points ?? 0;
    const total_wins = rounds.reduce((s, r) => s + r.wins, 0);
    const total_points = r1 + r2 + r3;

    return {
      branch_id: branch.id,
      branch_code: branch.branch_code,
      branch_name: branch.branch_name,
      area: branch.area,
      region: branch.region,
      rank: 0,
      total_points,
      round1_points: r1,
      round2_points: r2,
      round3_points: r3,
      total_wins,
      status: "active" as BranchStatus,
      eliminated_in_round: null,
      last_active_round: rounds.length
        ? Math.max(...rounds.map((r) => r.round_number))
        : 0,
      advancing_to_round: null,
      latest_published_round: rounds.length
        ? Math.max(...rounds.map((r) => r.round_number))
        : 0,
    };
  });

  rows.sort(compareStandingRows);

  const advancementCount =
    seasonSlug === "july_region"
      ? SCORING_CONFIG.july_region.advancementPerRegion
      : "advancementCount" in config
        ? (config.advancementCount ?? 1)
        : 1;

  rows.forEach((row, index) => {
    row.rank = index + 1;
    if (seasonSlug === "august_finals" && row.rank === 1) {
      row.status = "champion";
    } else if (row.rank <= advancementCount) {
      row.status =
        seasonSlug === "july_region" ? "regional_finalist" : "advanced";
    } else {
      row.status = "eliminated";
    }
  });

  return rows;
}

export function computeStandings(
  seasonSlug: SeasonSlug,
  branches: BranchInput[],
  resultsByBranch: Map<string, RoundPoints[]>,
  options?: ComputeStandingsOptions
): StandingRow[] {
  if (seasonSlug === "june_area" || seasonSlug === "july_region") {
    return computePerRoundEliminationStandings(
      seasonSlug,
      branches,
      resultsByBranch,
      options
    );
  }
  return computeCumulativeStandings(
    seasonSlug,
    branches,
    resultsByBranch,
    options
  );
}

/** Branches eligible to enter scores for `targetRound` (survivors from prior round). */
export function getEligibleBranchIdsForRound(
  seasonSlug: SeasonSlug,
  branches: BranchInput[],
  resultsByBranch: Map<string, RoundPoints[]>,
  targetRound: number,
  publishedRoundNumbers: number[],
  manualAdvances: ManualAdvance[] = []
): Set<string> {
  if (targetRound <= 1) return new Set(branches.map((b) => b.id));

  if (!usesPerRoundElimination(seasonSlug)) {
    return new Set(branches.map((b) => b.id));
  }

  const priorPublished = publishedRoundNumbers.filter((r) => r < targetRound);
  const standings = computeStandings(seasonSlug, branches, resultsByBranch, {
    publishedRoundNumbers: priorPublished,
    manualAdvances,
  });

  return new Set(
    standings
      .filter(
        (r) =>
          r.eliminated_in_round === null && r.tie_breaker_in_round === null
      )
      .map((r) => r.branch_id)
  );
}

function statusSortOrder(status: BranchStatus): number {
  if (status === "eliminated") return 3;
  if (status === "tie_breaker") return 2;
  return 0;
}

export function compareStandingRows(a: StandingRow, b: StandingRow): number {
  const orderA = statusSortOrder(a.status);
  const orderB = statusSortOrder(b.status);
  if (orderA !== orderB) return orderA - orderB;
  if (b.total_points !== a.total_points) return b.total_points - a.total_points;
  const aR3 = a.round3_points ?? -1;
  const bR3 = b.round3_points ?? -1;
  if (bR3 !== aR3) return bR3 - aR3;
  const aR2 = a.round2_points ?? -1;
  const bR2 = b.round2_points ?? -1;
  if (bR2 !== aR2) return bR2 - aR2;
  return a.branch_name.localeCompare(b.branch_name);
}

export interface ResultWithRound {
  branch_id: string;
  points: number;
  wins: number;
  losses: number;
  round_number: number;
}

export function aggregatePublishedResults(
  results: ResultWithRound[]
): Map<string, RoundPoints[]> {
  const map = new Map<string, RoundPoints[]>();
  for (const r of results) {
    const list = map.get(r.branch_id) ?? [];
    const existing = list.find((x) => x.round_number === r.round_number);
    if (existing) {
      existing.points += Number(r.points);
      existing.wins += r.wins;
      existing.losses += r.losses;
    } else {
      list.push({
        round_number: r.round_number,
        points: Number(r.points),
        wins: r.wins,
        losses: r.losses,
      });
    }
    map.set(r.branch_id, list);
  }
  return map;
}
