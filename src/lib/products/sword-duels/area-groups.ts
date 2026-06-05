import type { Branch } from "@/lib/types";
import type { SdAreaBracket, SdAreaGroupBranch } from "./types";

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
  };
}

/** Split branches in an area into Group A (first half) and Group B (second half). */
export function splitAreaIntoGroups(branches: Branch[]): {
  groupA: SdAreaGroupBranch[];
  groupB: SdAreaGroupBranch[];
} {
  const sorted = [...branches].sort((a, b) =>
    a.branch_code.localeCompare(b.branch_code, undefined, { numeric: true })
  );
  const midpoint = Math.ceil(sorted.length / 2);
  const groupA = sorted
    .slice(0, midpoint)
    .map((b, i) => toGroupBranch(b, "a", i + 1));
  const groupB = sorted
    .slice(midpoint)
    .map((b, i) => toGroupBranch(b, "b", i + 1));
  return { groupA, groupB };
}

export function buildAreaBrackets(branches: Branch[]): SdAreaBracket[] {
  const byArea = new Map<string, Branch[]>();
  for (const b of branches) {
    const key = b.area.trim();
    if (!byArea.has(key)) byArea.set(key, []);
    byArea.get(key)!.push(b);
  }

  return [...byArea.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([area, areaBranches]) => {
      const { groupA, groupB } = splitAreaIntoGroups(areaBranches);
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
