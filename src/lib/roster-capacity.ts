import { TARGET_BRANCH_COUNT } from "@/lib/branch-targets";
import type { Branch } from "@/lib/types";
import type { StandingRow } from "@/lib/types";
import { REGIONS, type Region, type SeasonSlug } from "@/lib/scoring-config";

/** July starts with 8 branches per region (24 total). */
export const JULY_SLOTS_PER_REGION = 8;

/** The Nationals field size. */
export const NATIONALS_SLOT_COUNT = 3;

export function juneSlotsPerRegion(branchCount: number): number {
  if (branchCount <= 0) return Math.ceil(TARGET_BRANCH_COUNT / REGIONS.length);
  const perRegion = Math.ceil(branchCount / REGIONS.length);
  return Math.max(perRegion, 32);
}

export function capacityTargetForRegion(
  seasonSlug: SeasonSlug,
  region: Region,
  branchCountInRegion: number,
  totalBranchCount: number
): number {
  if (seasonSlug === "june_area") {
    return Math.max(branchCountInRegion, juneSlotsPerRegion(totalBranchCount));
  }
  if (seasonSlug === "july_region") {
    return JULY_SLOTS_PER_REGION;
  }
  return NATIONALS_SLOT_COUNT;
}

export function branchToCapacityRow(branch: Branch, rank: number): StandingRow {
  return {
    branch_id: branch.id,
    branch_code: branch.branch_code,
    branch_name: branch.branch_name,
    area: branch.area,
    region: branch.region,
    rank,
    total_points: 0,
    round1_points: null,
    round2_points: null,
    round3_points: null,
    total_wins: 0,
    status: "active",
    representative_1: branch.representative_1,
    representative_2: branch.representative_2,
    latest_published_round: 0,
  };
}

export function makePlaceholderRow(
  seasonSlug: SeasonSlug,
  region: Region,
  slotIndex: number,
  rank: number
): StandingRow {
  const label =
    seasonSlug === "july_region"
      ? `July slot ${slotIndex}`
      : seasonSlug === "august_finals"
        ? `Champion slot ${slotIndex}`
        : `Open slot ${slotIndex}`;
  return {
    branch_id: `placeholder-${seasonSlug}-${region}-${slotIndex}`,
    branch_code: `TBD-${String(slotIndex).padStart(2, "0")}`,
    branch_name: label,
    area: "—",
    region,
    rank,
    total_points: 0,
    round1_points: null,
    round2_points: null,
    round3_points: null,
    total_wins: 0,
    status: "active",
    is_placeholder: true,
    latest_published_round: 0,
  };
}

export function buildNationalsCapacityStandings(branches: Branch[]): StandingRow[] {
  const rows: StandingRow[] = [];
  for (let i = 0; i < NATIONALS_SLOT_COUNT; i++) {
    const region = REGIONS[i];
    const branch = branches.find((b) => b.region === region);
    if (branch) {
      rows.push(branchToCapacityRow(branch, i + 1));
    } else {
      rows.push(makePlaceholderRow("august_finals", region, i + 1, i + 1));
    }
  }
  return rows;
}

export function buildCapacityStandings(
  seasonSlug: SeasonSlug,
  region: Region,
  branches: Branch[],
  totalBranchCount: number
): StandingRow[] {
  if (seasonSlug === "august_finals") {
    return buildNationalsCapacityStandings(branches);
  }

  const inRegion = branches.filter((b) => b.region === region);
  const target = capacityTargetForRegion(
    seasonSlug,
    region,
    inRegion.length,
    totalBranchCount
  );

  const rows: StandingRow[] = inRegion.map((b, i) =>
    branchToCapacityRow(b, i + 1)
  );

  for (let slot = rows.length + 1; slot <= target; slot++) {
    rows.push(makePlaceholderRow(seasonSlug, region, slot, slot));
  }

  return rows.map((row, i) => ({ ...row, rank: i + 1 }));
}
