import { previewBranchName } from "@/lib/compare-preview-names";
import {
  previewRoundLabel,
  type PreviewRound,
} from "@/lib/compare-preview-constants";
import { getDemoJuneStandingsForRound } from "@/lib/demo/generate-demo-standings";
import type { FullLeaderboardData } from "@/lib/full-leaderboard-data";
import { buildJuneCutoffForRegion } from "@/lib/june-cutoff";
import { REGION_LABELS, REGIONS, type Region } from "@/lib/scoring-config";
import type { StandingRow } from "@/lib/types";

export type { PreviewRound } from "@/lib/compare-preview-constants";
export {
  PREVIEW_ROUNDS,
  parsePreviewRound,
} from "@/lib/compare-preview-constants";
export { previewRoundLabel };

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

function enrichPreviewRows(
  rows: StandingRow[],
  latestPublishedRound: PreviewRound
): StandingRow[] {
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
      latest_published_round: latestPublishedRound,
    };
  });
}

/**
 * Sample June standings for layout previews at a specific published round.
 */
export function getCompareLeaderboardPreviewData(
  round: PreviewRound = 3
): FullLeaderboardData {
  const latestPublishedRound = round;
  const phaseTitle = "June — Area-wide";
  const roundName = previewRoundLabel(round);

  const byRegion = REGIONS.map((region) => {
    const rows = enrichPreviewRows(
      getDemoJuneStandingsForRound(region, round),
      round
    );
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
    phaseTitle: `${phaseTitle} · ${roundName}`,
  };
}
