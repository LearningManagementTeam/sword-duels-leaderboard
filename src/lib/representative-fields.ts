/** Shared branch representative columns — names, employee no., position. */

export const BRANCH_REP_COLUMNS =
  "representative_1, representative_2, representative_1_employee_no, representative_1_position, representative_2_employee_no, representative_2_position";

export const BRANCH_WITH_REPS_SELECT = `id, branch_code, branch_name, area, region, ${BRANCH_REP_COLUMNS}`;

export interface BranchRepresentativeFields {
  representative_1?: string | null;
  representative_2?: string | null;
  representative_1_employee_no?: string | null;
  representative_1_position?: string | null;
  representative_2_employee_no?: string | null;
  representative_2_position?: string | null;
}

export type RepresentativeSavePayload = {
  branch_id: string;
  representative_1: string;
  representative_2: string;
  representative_1_employee_no: string;
  representative_1_position: string;
  representative_2_employee_no: string;
  representative_2_position: string;
};

export function representativeDbUpdate(row: Omit<RepresentativeSavePayload, "branch_id">) {
  return {
    representative_1: row.representative_1.trim() || null,
    representative_2: row.representative_2.trim() || null,
    representative_1_employee_no: row.representative_1_employee_no.trim() || null,
    representative_1_position: row.representative_1_position.trim() || null,
    representative_2_employee_no: row.representative_2_employee_no.trim() || null,
    representative_2_position: row.representative_2_position.trim() || null,
  };
}

export function repSnapshot(row: BranchRepresentativeFields): string {
  return [
    row.representative_1 ?? "",
    row.representative_2 ?? "",
    row.representative_1_employee_no ?? "",
    row.representative_1_position ?? "",
    row.representative_2_employee_no ?? "",
    row.representative_2_position ?? "",
  ].join("\0");
}
