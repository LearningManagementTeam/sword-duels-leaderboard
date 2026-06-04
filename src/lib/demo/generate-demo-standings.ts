import {
  computeStandings,
  type BranchInput,
  type RoundPoints,
} from "@/lib/scoring";
import { REGIONS, type Region, type SeasonSlug } from "@/lib/scoring-config";
import type { StandingRow } from "@/lib/types";
import { DEMO_BRANCHES } from "./demo-branches";

function quizScore(branchIndex: number): number {
  return (branchIndex * 7 + 13) % 11;
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
  const r1Max = seasonSlug === "june_area" ? 10 : 15;

  branches.forEach((branch, index) => {
    const score =
      seasonSlug === "june_area"
        ? quizScore(index + 1)
        : Math.min(15, quizScore(index + 1) + 5);
    results.set(branch.id, [
      {
        round_number: 1,
        points: Math.min(r1Max, score),
        wins: 0,
        losses: 0,
      },
    ]);
  });

  const afterR1 = computeStandings(seasonSlug, branches, results, {
    publishedRoundNumbers: [1],
  });

  for (const region of REGIONS) {
    const regional = afterR1
      .filter(
        (r) =>
          r.region === region &&
          r.eliminated_in_round === null &&
          r.tie_breaker_in_round === null
      )
      .sort((a, b) => (b.round1_points ?? 0) - (a.round1_points ?? 0));

    const r2Cut = seasonSlug === "june_area" ? 16 : 2;
    regional.forEach((row, i) => {
      const list = results.get(row.branch_id);
      if (!list) return;
      if (seasonSlug === "july_region") {
        list.push({
          round_number: 2,
          points: i < r2Cut ? Math.max(1, 3 - (i % 3)) : 0,
          wins: 0,
          losses: 0,
        });
      } else {
        list.push({
          round_number: 2,
          points: i < r2Cut ? 1 : 0,
          wins: 0,
          losses: 0,
        });
      }
    });
  }

  const afterR2 = computeStandings(seasonSlug, branches, results, {
    publishedRoundNumbers: [1, 2],
  });

  for (const region of REGIONS) {
    const regional = afterR2
      .filter(
        (r) =>
          r.region === region &&
          r.eliminated_in_round === null &&
          r.tie_breaker_in_round === null
      )
      .sort((a, b) => a.branch_name.localeCompare(b.branch_name));

    const r3Cut = seasonSlug === "june_area" ? 8 : 1;
    regional.forEach((row, i) => {
      const list = results.get(row.branch_id);
      if (!list) return;
      if (i < r3Cut) {
        list.push({
          round_number: 3,
          points: 5,
          wins: 0,
          losses: 0,
          finish_order: i + 1,
        });
      } else {
        list.push({
          round_number: 3,
          points: (i % 5),
          wins: 0,
          losses: 0,
          finish_order: null,
        });
      }
    });
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
  for (const region of REGIONS) {
    const regional = getDemoJulyStandings(region);
    const winner = regional.find((r) => r.status === "regional_finalist");
    if (winner) {
      const branch = toBranchInput().find((b) => b.id === winner.branch_id);
      if (branch) champions.push(branch);
    }
  }

  const results = new Map<string, RoundPoints[]>();
  champions.forEach((branch, index) => {
    results.set(branch.id, [
      { round_number: 1, points: 100 - index * 5, wins: 0, losses: 0 },
      { round_number: 2, points: index === 0 ? 100 : index === 1 ? 50 : 100, wins: 0, losses: 0 },
      { round_number: 3, points: index === 0 ? 100 : index === 1 ? 100 : 50, wins: 0, losses: 0 },
    ]);
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

export function getDemoJuneStandingsForRound(
  region: Region,
  publishedRound: 1 | 2 | 3
): StandingRow[] {
  const branches = toBranchInput();
  const results = getJuneResults();
  return attachReps(
    computeStandings("june_area", branches, results, {
      filterRegion: region,
      publishedRoundNumbers: Array.from({ length: publishedRound }, (_, i) => i + 1),
    })
  ).map((row) => ({ ...row, latest_published_round: publishedRound }));
}
