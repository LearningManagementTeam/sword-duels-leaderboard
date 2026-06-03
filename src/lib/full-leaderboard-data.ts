import { getDemoJuneStandings } from "@/lib/demo/generate-demo-standings";
import {
  getLatestPublishedRoundNumber,
  getPublishedStandings,
  getSeasonBySlug,
} from "@/lib/data/queries";
import {
  getSurvivorCount,
  REGION_LABELS,
  REGIONS,
  type Region,
} from "@/lib/scoring-config";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { StandingRow } from "@/lib/types";

export type RegionBoard = {
  region: Region;
  regionLabel: string;
  rows: StandingRow[];
  cutoff: number;
  cutLineLabel?: string;
};

export type FullLeaderboardData = {
  byRegion: RegionBoard[];
  unified: StandingRow[];
  latestPublishedRound: number;
  isDemo: boolean;
  phaseTitle: string;
};

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

export async function getFullLeaderboardJuneData(): Promise<FullLeaderboardData> {
  const phaseTitle = "June — Area-wide";

  if (isSupabaseConfigured()) {
    const season = await getSeasonBySlug("june_area");
    if (season) {
      const latestPublishedRound = await getLatestPublishedRoundNumber(
        season.id
      );
      const byRegion = await Promise.all(
        REGIONS.map(async (region) => {
          const rows = await getPublishedStandings(season.id, region);
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
        })
      );

      if (byRegion.some((b) => b.rows.length > 0)) {
        return {
          byRegion,
          unified: byRegion.flatMap((b) => b.rows),
          latestPublishedRound,
          isDemo: false,
          phaseTitle,
        };
      }
    }
  }

  const latestPublishedRound = 3;
  const byRegion = REGIONS.map((region) => {
    const rows = getDemoJuneStandings(region);
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
