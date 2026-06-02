import type { BranchStatus, RoundResult, StandingRow } from "./types";
import type { Region, SeasonSlug } from "./scoring-config";
import { SCORING_CONFIG } from "./scoring-config";

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

export function computeStandings(
  seasonSlug: SeasonSlug,
  branches: BranchInput[],
  resultsByBranch: Map<string, RoundPoints[]>,
  options?: { filterRegion?: Region }
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

export function compareStandingRows(a: StandingRow, b: StandingRow): number {
  if (b.total_points !== a.total_points) return b.total_points - a.total_points;
  if (b.round3_points !== a.round3_points)
    return b.round3_points - a.round3_points;
  if (b.round2_points !== a.round2_points)
    return b.round2_points - a.round2_points;
  if (b.total_wins !== a.total_wins) return b.total_wins - a.total_wins;
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
