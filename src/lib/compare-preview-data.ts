import { previewBranchName } from "@/lib/compare-preview-names";
import { getDemoJuneStandings } from "@/lib/demo/generate-demo-standings";
import type { FullLeaderboardData } from "@/lib/full-leaderboard-data";
import { buildJuneCutoffForRegion } from "@/lib/full-leaderboard-data";
import { REGION_LABELS, REGIONS, type Region } from "@/lib/scoring-config";
import type { StandingRow } from "@/lib/types";

const PREVIEW_REP2 = [
  "Alex Rivera",
  "Sam Dela Rosa",
  "Pat Mendoza",
  "Chris Navarro",
  "Jordan Santos",
  "Taylor Garcia",
  "Morgan Reyes",
  "Casey Torres",
];

function enrichPreviewRows(rows: StandingRow[]): StandingRow[] {
  const regionCounters: Record<Region, number> = { luzon: 0, ncr: 0, vismin: 0 };

  return rows.map((row, rowIndex) => {
    const nameIndex = regionCounters[row.region]++;
    const branch_name = previewBranchName(row.region, nameIndex);

    return {
      ...row,
      branch_name,
      representative_1: row.representative_1 ?? "Preview Rep A",
      representative_2:
        row.representative_2 ||
        (rowIndex % 2 === 0 ? PREVIEW_REP2[rowIndex % PREVIEW_REP2.length] : null),
      latest_published_round: 3,
    };
  });
}

/**
 * Rich sample standings for /compare/leaderboard/* layout previews.
 * Always uses demo June data (after Round 3) with realistic branch names —
 * never live DB, so layouts always look fully populated.
 */
export function getCompareLeaderboardPreviewData(): FullLeaderboardData {
  const latestPublishedRound = 3;
  const phaseTitle = "June — Area-wide";

  const byRegion = REGIONS.map((region) => {
    const rows = enrichPreviewRows(getDemoJuneStandings(region));
    const { cutoff, cutLineLabel } = buildJuneCutoffForRegion(
      region,
      latestPublishedRound
    );
    return {
      region,
      regionLabel: REGION_LABELS[region],
      rows,
      cutoff,
      cutLineLabel,
    };
  });

  return {
    byRegion,
    unified: byRegion.flatMap((b) => b.rows),
    latestPublishedRound,
    isDemo: true,
    phaseTitle,
  };
}
