import type { SdAreaGroupBranch, SdScoringMode, SdSetScore } from "./types";

export interface ScoredBranch {
  branch_id: string;
  branch_code: string;
  branch_name: string;
  points: number;
  hearts_remaining: number | null;
  is_eliminated: boolean;
  rank: number;
  is_winner: boolean;
  representative_1?: string | null;
  representative_2?: string | null;
}

function scoreMap(scores: SdSetScore[]): Map<string, SdSetScore> {
  return new Map(scores.map((s) => [s.branch_id, s]));
}

function compareHighScore(
  a: { points: number; branch_code: string },
  b: { points: number; branch_code: string }
): number {
  if (b.points !== a.points) return b.points - a.points;
  return a.branch_code.localeCompare(b.branch_code, undefined, { numeric: true });
}

function compareSurvival(
  a: { hearts_remaining: number | null; points: number; is_eliminated: boolean; branch_code: string },
  b: { hearts_remaining: number | null; points: number; is_eliminated: boolean; branch_code: string }
): number {
  if (a.is_eliminated !== b.is_eliminated) return a.is_eliminated ? 1 : -1;
  const heartsA = a.hearts_remaining ?? 0;
  const heartsB = b.hearts_remaining ?? 0;
  if (heartsB !== heartsA) return heartsB - heartsA;
  if (b.points !== a.points) return b.points - a.points;
  return a.branch_code.localeCompare(b.branch_code, undefined, { numeric: true });
}

/** Rank participants and pick the set winner. */
export function computeSetResults(
  participants: SdAreaGroupBranch[],
  scores: SdSetScore[],
  scoringMode: SdScoringMode
): { ranked: ScoredBranch[]; winnerId: string | null } {
  const byScore = scoreMap(scores);

  const rows = participants.map((p) => {
    const s = byScore.get(p.branch_id);
    return {
      branch_id: p.branch_id,
      branch_code: p.branch_code,
      branch_name: p.branch_name,
      points: s?.points ?? 0,
      hearts_remaining: s?.hearts_remaining ?? null,
      is_eliminated: s?.is_eliminated ?? false,
      representative_1: p.representative_1,
      representative_2: p.representative_2,
      representative_1_employee_no: p.representative_1_employee_no,
      representative_1_position: p.representative_1_position,
      representative_2_employee_no: p.representative_2_employee_no,
      representative_2_position: p.representative_2_position,
    };
  });

  const sorted =
    scoringMode === "survival"
      ? [...rows].sort(compareSurvival)
      : [...rows].sort(compareHighScore);

  const ranked: ScoredBranch[] = sorted.map((r, i) => ({
    ...r,
    rank: i + 1,
    is_winner: false,
  }));

  if (ranked.length === 0) {
    return { ranked, winnerId: null };
  }

  if (scoringMode === "survival") {
    const survivors = ranked.filter((r) => !r.is_eliminated && (r.hearts_remaining ?? 0) > 0);
    const pool = survivors.length >= 2 ? survivors.slice(0, 2) : survivors.length > 0 ? survivors : ranked.slice(0, 1);
    const winner = pool.sort(compareHighScore)[0];
    if (winner) {
      const idx = ranked.findIndex((r) => r.branch_id === winner.branch_id);
      if (idx >= 0) ranked[idx].is_winner = true;
      return { ranked, winnerId: winner.branch_id };
    }
  }

  ranked[0].is_winner = true;
  return { ranked, winnerId: ranked[0].branch_id };
}
