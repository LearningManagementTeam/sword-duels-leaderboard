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
    representative_1_photo_path: branch.representative_1_photo_path,
    representative_2_photo_path: branch.representative_2_photo_path,
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

/** Areas with hand-picked Group A/B (stored on sd_events.manual_area_groups). */
export function parseManualAreaGroups(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((s) => s.trim());
}

export function isManualAreaGroup(
  manualAreas: readonly string[],
  area: string
): boolean {
  const key = area.trim();
  return manualAreas.some((a) => a.trim() === key);
}

export function validateAreaGroupAssignment(
  allBranchIds: string[],
  groupAIds: string[],
  groupBIds: string[]
): string | null {
  const allSet = new Set(allBranchIds);
  const bSet = new Set(groupBIds);

  for (const id of groupAIds) {
    if (bSet.has(id)) return "A branch cannot be in both Group A and Group B.";
    if (!allSet.has(id)) return "Group A includes a branch that is not in this area.";
  }
  for (const id of groupBIds) {
    if (!allSet.has(id)) return "Group B includes a branch that is not in this area.";
  }

  const assigned = new Set([...groupAIds, ...groupBIds]);
  if (assigned.size !== allBranchIds.length) {
    const missing = allBranchIds.filter((id) => !assigned.has(id));
    return `${missing.length} branch(es) are not assigned to a group.`;
  }

  if (groupAIds.length === 0 || groupBIds.length === 0) {
    return "Each group needs at least one branch.";
  }

  return null;
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

/** Numeric order for labels like "Area 1" … "Area 15" (not lexicographic). */
export function parseAreaNumber(area: string): number | null {
  const m = /area\s*(\d+)/i.exec(area.trim());
  return m ? Number.parseInt(m[1]!, 10) : null;
}

export function compareAreaNames(a: string, b: string): number {
  const na = parseAreaNumber(a);
  const nb = parseAreaNumber(b);
  if (na != null && nb != null) return na - nb;
  if (na != null) return -1;
  if (nb != null) return 1;
  return a.localeCompare(b, undefined, { numeric: true });
}

export function sortAreasByNumber(areas: string[]): string[] {
  return [...areas].sort(compareAreaNames);
}

export type BranchListSortMode =
  | SdGroupSortMode
  | "area_then_code"
  | "area_then_name";

export const BRANCH_LIST_SORT_LABELS: Record<BranchListSortMode, string> = {
  ...SD_GROUP_SORT_LABELS,
  area_then_code: "Area, then branch code",
  area_then_name: "Area, then branch name",
};

export function compareBranchesForList<
  T extends { branch_code: string; branch_name: string; area: string },
>(a: T, b: T, mode: BranchListSortMode): number {
  if (mode === "area_then_code" || mode === "area_then_name") {
    const areaCmp = compareAreaNames(a.area, b.area);
    if (areaCmp !== 0) return areaCmp;
    return compareBranchesForList(
      a,
      b,
      mode === "area_then_code" ? "branch_code" : "branch_name"
    );
  }

  if (mode === "branch_name") {
    const nameCmp = a.branch_name.localeCompare(b.branch_name, undefined, {
      sensitivity: "base",
    });
    if (nameCmp !== 0) return nameCmp;
  }

  return a.branch_code.localeCompare(b.branch_code, undefined, { numeric: true });
}

export function sortBranchesForList<
  T extends { branch_code: string; branch_name: string; area: string },
>(branches: T[], mode: BranchListSortMode): T[] {
  return [...branches].sort((a, b) => compareBranchesForList(a, b, mode));
}

export function decodeAreaSlug(slug: string): string {
  return decodeURIComponent(slug);
}
