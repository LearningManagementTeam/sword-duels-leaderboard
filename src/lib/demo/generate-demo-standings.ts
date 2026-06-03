import {
  computeStandings,
  type BranchInput,
  type RoundPoints,
  aggregatePublishedResults,
  getEligibleBranchIdsForRound,
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

function toBranchInput(): BranchInput[] {
  return DEMO_BRANCHES.map((b) => ({
    id: b.id,
    branch_code: b.branch_code,
    branch_name: b.branch_name,
    area: b.area,
    region: b.region,
  }));
}

function buildEliminationResults(
  branches: BranchInput[],
  seasonSlug: "june_area" | "july_region"
): Map<string, RoundPoints[]> {
  const results = new Map<string, RoundPoints[]>();

  branches.forEach((branch, index) => {
    results.set(branch.id, [
      {
        round_number: 1,
        points: seededPoints(index + 1, 1),
        wins: seededWins(index + 1, 1),
        losses: Math.max(0, 5 - seededWins(index + 1, 1)),
      },
    ]);
  });

  for (let round = 2; round <= 3; round++) {
    const publishedRoundNumbers = Array.from({ length: round - 1 }, (_, i) => i + 1);
    const eligible = getEligibleBranchIdsForRound(
      seasonSlug,
      branches,
      results,
      round,
      publishedRoundNumbers
    );

    for (const branch of branches) {
      if (!eligible.has(branch.id)) continue;
      const index = branches.findIndex((b) => b.id === branch.id);
      const list = results.get(branch.id)!;
      list.push({
        round_number: round,
        points: seededPoints(index + 1, round),
        wins: seededWins(index + 1, round),
        losses: Math.max(0, 5 - seededWins(index + 1, round)),
      });
    }
  }

  return results;
}

function attachReps(rows: StandingRow[]): StandingRow[] {
  const byId = new Map(DEMO_BRANCHES.map((b) => [b.id, b]));
  return rows.map((row) => {
    const branch = byId.get(row.branch_id);
    return {
      ...row,
      representative_1: branch?.representative_1 ?? null,
      representative_2: branch?.representative_2 || null,
      latest_published_round: 3,
    };
  });
}

let juneResultsCache: Map<string, RoundPoints[]> | null = null;

function getJuneResults(): Map<string, RoundPoints[]> {
  if (!juneResultsCache) {
    juneResultsCache = buildEliminationResults(toBranchInput(), "june_area");
  }
  return juneResultsCache;
}

export function getDemoJuneStandings(region?: Region): StandingRow[] {
  const branches = toBranchInput();
  const results = getJuneResults();
  return attachReps(
    computeStandings("june_area", branches, results, {
      filterRegion: region,
      publishedRoundNumbers: [1, 2, 3],
    })
  );
}

export function getDemoJulyStandings(region: Region): StandingRow[] {
  const june = getDemoJuneStandings();
  const advancingIds = new Set(
    june.filter((r) => r.status === "advanced").map((r) => r.branch_id)
  );
  const branches = toBranchInput().filter((b) => advancingIds.has(b.id));
  const results = buildEliminationResults(branches, "july_region");
  return attachReps(
    computeStandings("july_region", branches, results, {
      filterRegion: region,
      publishedRoundNumbers: [1, 2, 3],
    })
  );
}

export function getDemoAugustStandings(): StandingRow[] {
  const champions: BranchInput[] = [];
  for (const region of ["luzon", "ncr", "vismin"] as Region[]) {
    const regional = getDemoJulyStandings(region);
    const winner = regional.find((r) => r.status === "regional_finalist");
    if (winner) {
      const branch = toBranchInput().find((b) => b.id === winner.branch_id);
      if (branch) champions.push(branch);
    }
  }

  const results = new Map<string, RoundPoints[]>();
  champions.forEach((branch, index) => {
    const rounds: RoundPoints[] = [];
    for (let r = 1; r <= 3; r++) {
      rounds.push({
        round_number: r,
        points: seededPoints(index + 50, r),
        wins: seededWins(index + 50, r),
        losses: 0,
      });
    }
    results.set(branch.id, rounds);
  });

  return attachReps(
    computeStandings("august_finals", champions, results, {
      publishedRoundNumbers: [1, 2, 3],
    })
  );
}

export function getDemoStandings(
  slug: SeasonSlug,
  region?: Region
): StandingRow[] {
  if (slug === "june_area") return getDemoJuneStandings(region);
  if (slug === "july_region") {
    if (!region) return getDemoJuneStandings().filter((r) => r.status === "advanced");
    return getDemoJulyStandings(region);
  }
  return getDemoAugustStandings();
}
