import type { StandingRow } from "@/lib/types";

export function filterLeaderboardRows(
  rows: StandingRow[],
  opts: {
    search: string;
    areaFilter: string;
    statusFilter: string;
  }
): StandingRow[] {
  return rows.filter((r) => {
    if (opts.search) {
      const q = opts.search.toLowerCase();
      if (
        !r.branch_name.toLowerCase().includes(q) &&
        !r.branch_code.toLowerCase().includes(q) &&
        !(r.representative_1?.toLowerCase().includes(q) ?? false) &&
        !(r.representative_2?.toLowerCase().includes(q) ?? false)
      ) {
        return false;
      }
    }
    if (opts.areaFilter && r.area !== opts.areaFilter) return false;
    if (opts.statusFilter && r.status !== opts.statusFilter) return false;
    return true;
  });
}
