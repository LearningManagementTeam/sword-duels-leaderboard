import {
  getSurvivorCount,
  type Region,
} from "@/lib/scoring-config";

export function buildJuneCutoffForRegion(
  region: Region,
  latestPublishedRound: number
): { cutoff: number; cutLineLabel?: string } {
  if (latestPublishedRound <= 0) {
    return { cutoff: 24 };
  }
  const cutoff =
    getSurvivorCount("june_area", latestPublishedRound, region) ?? 32;
  if (latestPublishedRound < 3) {
    return {
      cutoff,
      cutLineLabel: `Cut line — top ${cutoff} advance to Round ${latestPublishedRound + 1}`,
    };
  }
  return {
    cutoff,
    cutLineLabel: `Cut line — top ${cutoff} advance to July`,
  };
}
