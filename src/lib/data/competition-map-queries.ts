import {
  getMilestoneMeta,
  regionBoardPath,
  type CompetitionMapConfig,
  type RegionHighlight,
} from "@/lib/competition-map";
import { getPublishedStandings, getSeasonBySlug } from "@/lib/data/queries";
import {
  REGIONS,
  REGION_LABELS,
  type Region,
  type SeasonSlug,
} from "@/lib/scoring-config";
import type { StandingRow } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/server";

const MAX_DISPLAY = 50;

export interface RegionContestantGroup {
  region: Region | null;
  regionLabel: string;
  rows: StandingRow[];
  totalInRegion: number;
  truncated: boolean;
  viewPath: string;
}

export interface RemainingContestantsResult {
  groups: RegionContestantGroup[];
  totalCount: number;
  seasonSlug: SeasonSlug | null;
  configured: boolean;
}

function isRemaining(row: StandingRow): boolean {
  return row.status !== "eliminated";
}

function filterRemaining(rows: StandingRow[]): StandingRow[] {
  return rows.filter(isRemaining);
}

function sortByRank(rows: StandingRow[]): StandingRow[] {
  return [...rows].sort((a, b) => a.rank - b.rank);
}

function capGroup(
  rows: StandingRow[],
  seasonSlug: SeasonSlug,
  region: Region | null
): Pick<
  RegionContestantGroup,
  "rows" | "totalInRegion" | "truncated" | "viewPath"
> {
  const sorted = sortByRank(rows);
  const totalInRegion = sorted.length;
  const truncated = totalInRegion > MAX_DISPLAY;
  const viewPath =
    seasonSlug === "august_finals" || region == null
      ? "/august"
      : regionBoardPath(seasonSlug, region);
  return {
    rows: sorted.slice(0, MAX_DISPLAY),
    totalInRegion,
    truncated,
    viewPath,
  };
}

async function fetchForRegion(
  seasonId: string,
  seasonSlug: SeasonSlug,
  region: Region | undefined
): Promise<StandingRow[]> {
  return getPublishedStandings(
    seasonId,
    seasonSlug === "august_finals" ? undefined : region
  );
}

export async function getRemainingContestantsForMap(
  config: CompetitionMapConfig
): Promise<RemainingContestantsResult> {
  const meta = getMilestoneMeta(config.milestoneId);
  const empty: RemainingContestantsResult = {
    groups: [],
    totalCount: 0,
    seasonSlug: meta.seasonSlug,
    configured: isSupabaseConfigured(),
  };

  if (!meta.seasonSlug || !isSupabaseConfigured()) {
    return empty;
  }

  const season = await getSeasonBySlug(meta.seasonSlug);
  if (!season) return empty;

  const highlight: RegionHighlight = config.regionHighlight;
  const groups: RegionContestantGroup[] = [];

  if (meta.usesRegions && highlight === "all") {
    for (const region of REGIONS) {
      const rows = filterRemaining(
        await fetchForRegion(season.id, meta.seasonSlug, region)
      );
      if (rows.length > 0) {
        const capped = capGroup(rows, meta.seasonSlug, region);
        groups.push({
          region,
          regionLabel: REGION_LABELS[region],
          ...capped,
        });
      }
    }
  } else if (meta.usesRegions && highlight !== "all") {
    const rows = filterRemaining(
      await fetchForRegion(season.id, meta.seasonSlug, highlight)
    );
    const capped = capGroup(rows, meta.seasonSlug, highlight);
    groups.push({
      region: highlight,
      regionLabel: REGION_LABELS[highlight],
      ...capped,
    });
  } else {
    const rows = filterRemaining(
      await fetchForRegion(season.id, meta.seasonSlug, undefined)
    );
    const capped = capGroup(rows, meta.seasonSlug, null);
    groups.push({
      region: null,
      regionLabel: "Finalists",
      ...capped,
    });
  }

  const totalCount = groups.reduce((n, g) => n + g.rows.length, 0);
  return {
    groups,
    totalCount,
    seasonSlug: meta.seasonSlug,
    configured: true,
  };
}
