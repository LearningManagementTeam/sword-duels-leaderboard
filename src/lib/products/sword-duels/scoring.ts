import {
  type RepScoreSnapshot,
  resolveActiveRepresentativeProfile,
} from "@/lib/representative-active";
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
  /** Rep who competed in this set (from active_representative). */
  active_representative_name?: string | null;
  active_representative_slot?: 1 | 2;
  active_representative_employee_no?: string | null;
  active_representative_position?: string | null;
  active_representative_photo_url?: string | null;
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
    const activeSlot = s?.active_representative ?? 1;
    const snapshot: RepScoreSnapshot | null = s
      ? {
          active_employee_id: s.active_employee_id,
          active_employee_name: s.active_employee_name,
          active_employee_no: s.active_employee_no,
          active_employee_position: s.active_employee_position,
          active_employee_status: s.active_employee_status,
          active_employee_photo_path: s.active_employee_photo_path,
        }
      : null;
    const profile = resolveActiveRepresentativeProfile(p, activeSlot, snapshot);
    return {
      branch_id: p.branch_id,
      branch_code: p.branch_code,
      branch_name: p.branch_name,
      points: s?.points ?? 0,
      hearts_remaining: s?.hearts_remaining ?? null,
      is_eliminated: s?.is_eliminated ?? false,
      representative_1: p.representative_1,
      representative_2: p.representative_2,
      active_representative_name: profile.name,
      active_representative_slot: activeSlot,
      active_representative_employee_no: profile.employeeNo,
      active_representative_position: profile.position,
      active_representative_photo_url: profile.photoUrl,
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
