import type { StandingRow } from "./types";

export function standingsToCsv(rows: StandingRow[]): string {
  const header = [
    "rank",
    "branch_code",
    "branch_name",
    "representative_1",
    "representative_1_employee_no",
    "representative_1_position",
    "representative_2",
    "representative_2_employee_no",
    "representative_2_position",
    "area",
    "region",
    "round1_points",
    "round2_points",
    "round3_points",
    "total_points",
    "eliminated_in_round",
    "status",
  ].join(",");
  const fmt = (v: number | null) => (v === null ? "" : String(v));
  const q = (s: string | null | undefined) =>
    `"${(s ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      r.rank,
      r.branch_code,
      q(r.branch_name),
      q(r.representative_1),
      q(r.representative_1_employee_no),
      q(r.representative_1_position),
      q(r.representative_2),
      q(r.representative_2_employee_no),
      q(r.representative_2_position),
      q(r.area),
      r.region,
      fmt(r.round1_points),
      fmt(r.round2_points),
      fmt(r.round3_points),
      r.total_points,
      r.eliminated_in_round ?? "",
      r.status,
    ].join(",")
  );
  return [header, ...lines].join("\n");
}
