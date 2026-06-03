import type { StandingRow } from "./types";

export function standingsToCsv(rows: StandingRow[]): string {
  const header = [
    "rank",
    "branch_code",
    "branch_name",
    "representative_1",
    "representative_2",
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
  const lines = rows.map((r) =>
    [
      r.rank,
      r.branch_code,
      `"${r.branch_name.replace(/"/g, '""')}"`,
      `"${(r.representative_1 ?? "").replace(/"/g, '""')}"`,
      `"${(r.representative_2 ?? "").replace(/"/g, '""')}"`,
      `"${r.area.replace(/"/g, '""')}"`,
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
