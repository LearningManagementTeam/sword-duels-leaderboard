import type { StandingRow } from "./types";

export function standingsToCsv(rows: StandingRow[]): string {
  const header = [
    "rank",
    "branch_code",
    "branch_name",
    "area",
    "region",
    "round1_points",
    "round2_points",
    "round3_points",
    "total_points",
    "total_wins",
    "status",
  ].join(",");
  const lines = rows.map((r) =>
    [
      r.rank,
      r.branch_code,
      `"${r.branch_name.replace(/"/g, '""')}"`,
      `"${r.area.replace(/"/g, '""')}"`,
      r.region,
      r.round1_points,
      r.round2_points,
      r.round3_points,
      r.total_points,
      r.total_wins,
      r.status,
    ].join(",")
  );
  return [header, ...lines].join("\n");
}
