import {
  computeStandings,
  type BranchInput,
  type RoundPoints,
} from "@/lib/scoring";
import type { Region, SeasonSlug } from "@/lib/scoring-config";
import type { StandingRow } from "@/lib/types";
import { DEMO_BRANCHES } from "./demo-branches";

function seededPoints(branchIndex: number, round: number): number {
  const base = (branchIndex * 7919 + round * 104729) % 8500;
  return Math.round((base / 100 + 15 + (142 - branchIndex) * 0.05) * 100) / 100;
}

function seededWins(branchIndex: number, round: number): number {
  return ((branchIndex * 17 + round * 31) % 12) + 1;
}

function buildResultsMap(
  branches: BranchInput[],
  roundsCompleted: number
): Map<string, RoundPoints[]> {
  const map = new Map<string, RoundPoints[]>();
  branches.forEach((branch, index) => {
    const rounds: RoundPoints[] = [];
    for (let r = 1; r <= roundsCompleted; r++) {
      rounds.push({
        round_number: r,
        points: seededPoints(index + 1, r),
        wins: seededWins(index + 1, r),
        losses: Math.max(0, 5 - seededWins(index + 1, r)),
      });
    }
    map.set(branch.id, rounds);
  });
  return map;
}

function toBranchInput(): BranchInput[] {
  return DEMO_BRANCHES.map((b) => ({
    id: b.id,
    branch_code: b.branch_code,
    branch_name: b.branch_name,
    area: b.area,
    region: b.region,
  }));
}

function attachReps(rows: StandingRow[]): StandingRow[] {
  const byId = new Map(DEMO_BRANCHES.map((b) => [b.id, b]));
  return rows.map((row) => {
    const branch = byId.get(row.branch_id);
    return {
      ...row,
      representative_1: branch?.representative_1 ?? null,
      representative_2: branch?.representative_2 || null,
    };
  });
}

let juneCache: StandingRow[] | null = null;

export function getDemoJuneStandings(): StandingRow[] {
  if (juneCache) return juneCache;
  const branches = toBranchInput();
  const results = buildResultsMap(branches, 3);
  juneCache = attachReps(computeStandings("june_area", branches, results));
  return juneCache;
}

export function getDemoJulyStandings(region: Region): StandingRow[] {
  const june = getDemoJuneStandings();
  const advancingIds = new Set(
    june.filter((r) => r.rank <= 24).map((r) => r.branch_id)
  );
  const branches = toBranchInput().filter((b) => advancingIds.has(b.id));
  const results = buildResultsMap(branches, 3);
  return attachReps(
    computeStandings("july_region", branches, results, { filterRegion: region })
  );
}

export function getDemoAugustStandings(): StandingRow[] {
  const champions: BranchInput[] = [];
  for (const region of ["luzon", "ncr", "vismin"] as Region[]) {
    const regional = getDemoJulyStandings(region);
    const winner = regional.find((r) => r.rank === 1);
    if (winner) {
      const branch = toBranchInput().find((b) => b.id === winner.branch_id);
      if (branch) champions.push(branch);
    }
  }
  const results = buildResultsMap(champions, 3);
  return attachReps(computeStandings("august_finals", champions, results));
}

export function getDemoStandings(
  slug: SeasonSlug,
  region?: Region
): StandingRow[] {
  if (slug === "june_area") return getDemoJuneStandings();
  if (slug === "july_region") {
    if (!region) return getDemoJuneStandings().filter((r) => r.rank <= 24);
    return getDemoJulyStandings(region);
  }
  return getDemoAugustStandings();
}
