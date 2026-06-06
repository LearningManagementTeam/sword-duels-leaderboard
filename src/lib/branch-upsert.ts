import type { BranchCsvRow } from "./branches-csv";

function setIfDefined(
  payload: Record<string, string | boolean | null>,
  key: string,
  value: string | null | undefined
) {
  if (value !== undefined) {
    payload[key] = (value ?? "").trim() || null;
  }
}

/** Build Supabase upsert payload; only sets rep fields when CSV provides them. */
export function branchUpsertPayload(
  row: BranchCsvRow,
  updatedAt?: string
): Record<string, string | boolean | null> {
  const payload: Record<string, string | boolean | null> = {
    branch_code: row.branch_code,
    branch_name: row.branch_name,
    area: row.area,
    region: row.region,
    is_active: true,
  };

  const touchesReps =
    row.representative_1 !== undefined ||
    row.representative_2 !== undefined ||
    row.representative_1_employee_no !== undefined ||
    row.representative_1_position !== undefined ||
    row.representative_2_employee_no !== undefined ||
    row.representative_2_position !== undefined;

  if (touchesReps) {
    setIfDefined(payload, "representative_1", row.representative_1);
    setIfDefined(payload, "representative_2", row.representative_2);
    setIfDefined(payload, "representative_1_employee_no", row.representative_1_employee_no);
    setIfDefined(payload, "representative_1_position", row.representative_1_position);
    setIfDefined(payload, "representative_2_employee_no", row.representative_2_employee_no);
    setIfDefined(payload, "representative_2_position", row.representative_2_position);
    payload.representatives_updated_at =
      updatedAt ?? new Date().toISOString();
  }

  return payload;
}

export function countRowsWithRepresentatives(rows: BranchCsvRow[]): number {
  return rows.filter((r) => r.representative_1?.trim()).length;
}
