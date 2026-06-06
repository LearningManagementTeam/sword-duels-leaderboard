import type { Region } from "@/lib/scoring-config";

export interface BranchRosterFields {
  branch_code: string;
  branch_name: string;
  area: string;
  region: Region;
}

export function normalizeBranchCode(code: string): string {
  return code.trim().toUpperCase();
}

export function validateBranchRosterFields(
  fields: BranchRosterFields
): string | null {
  const code = normalizeBranchCode(fields.branch_code);
  if (!code) return "Branch code is required.";
  if (!fields.branch_name.trim()) return "Branch name is required.";
  if (!fields.area.trim()) return "Area is required.";
  const region = fields.region;
  if (region !== "luzon" && region !== "ncr" && region !== "vismin") {
    return "Region must be Luzon, NCR, or VisMin.";
  }
  return null;
}

export function branchRosterDbRow(fields: BranchRosterFields) {
  return {
    branch_code: normalizeBranchCode(fields.branch_code),
    branch_name: fields.branch_name.trim(),
    area: fields.area.trim(),
    region: fields.region,
  };
}
