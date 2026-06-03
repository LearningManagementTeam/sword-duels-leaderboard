import type { BranchCsvRow } from "./branches-csv";

/** Build Supabase upsert payload; only sets rep fields when CSV provides them. */
export function branchUpsertPayload(
  row: BranchCsvRow,
  updatedAt?: string
): Record<string, string | null> {
  const payload: Record<string, string | null> = {
    branch_code: row.branch_code,
    branch_name: row.branch_name,
    area: row.area,
    region: row.region,
  };

  const rep1 = row.representative_1?.trim();
  const rep2 = row.representative_2?.trim();

  if (rep1 || rep2) {
    if (rep1) payload.representative_1 = rep1;
    if (rep2) payload.representative_2 = rep2;
    else if (rep1 && row.representative_2 !== undefined) {
      payload.representative_2 = null;
    }
    payload.representatives_updated_at =
      updatedAt ?? new Date().toISOString();
  }

  return payload;
}

export function countRowsWithRepresentatives(rows: BranchCsvRow[]): number {
  return rows.filter((r) => r.representative_1?.trim()).length;
}
