import type { Branch } from "@/lib/types";
import type { SdAreaBracket, SdAreaGroupBranch } from "./types";

export type SdGroupSortMode = "branch_code" | "branch_name";

export const SD_GROUP_SORT_LABELS: Record<SdGroupSortMode, string> = {
  branch_code: "Branch code (numeric)",
  branch_name: "Branch name (A–Z)",
};

function toGroupBranch(
  branch: Branch,
  group_label: "a" | "b",
  sort_order: number
): SdAreaGroupBranch {
  return {
    branch_id: branch.id,
    branch_code: branch.branch_code,
    branch_name: branch.branch_name,
    area: branch.area,
    region: branch.region,
    group_label,
    sort_order,
    representative_1: branch.representative_1,
    representative_2: branch.representative_2,
    representative_1_employee_no: branch.representative_1_employee_no,
    representative_1_position: branch.representative_1_position,
    representative_2_employee_no: branch.representative_2_employee_no,
    representative_2_position: branch.representative_2_position,
    representative_1_employee_id: branch.representative_1_employee_id,
    representative_2_employee_id: branch.representative_2_employee_id,
    representative_1_employment_status: branch.representative_1_employment_status,
    representative_2_employment_status: branch.representative_2_employment_status,
  };
}

export function sortBranchesForGrouping(
  branches: Branch[],
  mode: SdGroupSortMode = "branch_code"
): Branch[] {
  return [...branches].sort((a, b) => {
    if (mode === "branch_name") {
      const nameCmp = a.branch_name.localeCompare(b.branch_name, undefined, {
        sensitivity: "base",
      });
      if (nameCmp !== 0) return nameCmp;
    }
    return a.branch_code.localeCompare(b.branch_code, undefined, { numeric: true });
  });
}

/** Split branches in an area into Group A (first half) and Group B (second half). */
export function splitAreaIntoGroups(
  branches: Branch[],
  mode: SdGroupSortMode = "branch_code"
): {
  groupA: SdAreaGroupBranch[];
  groupB: SdAreaGroupBranch[];
} {
  const sorted = sortBranchesForGrouping(branches, mode);
  const midpoint = Math.ceil(sorted.length / 2);
  const groupA = sorted
    .slice(0, midpoint)
    .map((b, i) => toGroupBranch(b, "a", i + 1));
  const groupB = sorted
    .slice(midpoint)
    .map((b, i) => toGroupBranch(b, "b", i + 1));
  return { groupA, groupB };
}

export function buildAreaBrackets(
  branches: Branch[],
  mode: SdGroupSortMode = "branch_code"
): SdAreaBracket[] {
  const byArea = new Map<string, Branch[]>();
  for (const b of branches) {
    const key = b.area.trim();
    if (!byArea.has(key)) byArea.set(key, []);
    byArea.get(key)!.push(b);
  }

  return [...byArea.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([area, areaBranches]) => {
      const { groupA, groupB } = splitAreaIntoGroups(areaBranches, mode);
      const region = areaBranches[0]?.region ?? "luzon";
      return {
        area,
        region,
        groupA,
        groupB,
        branchCount: areaBranches.length,
      };
    });
}

export function areaSlug(area: string): string {
  return encodeURIComponent(area.trim());
}

export function decodeAreaSlug(slug: string): string {
  return decodeURIComponent(slug);
}
