import {
  getMilestoneMeta,
  milestoneIdForSeasonRound,
  regionBoardPath,
  type CompetitionMapConfig,
  type CompetitionMilestoneId,
  type RegionHighlight,
} from "@/lib/competition-map";
import {
  getLatestPublishedRoundInfo,
  getPublishedStandings,
  getSeasonBySlug,
} from "@/lib/data/queries";
import { seasonPhaseLabel } from "@/lib/season-labels";
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
  /** Milestone pinned in Admin → Competition map */
  mapMilestoneId: CompetitionMilestoneId;
  /** Milestone used to load roster data (may follow latest publish) */
  dataMilestoneId: CompetitionMilestoneId;
  /** True when map chapter and live published standings disagree */
  dataMismatch: boolean;
  mismatchMessage: string | null;
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

async function seasonHasPublishedRows(
  seasonId: string,
  seasonSlug: SeasonSlug
): Promise<boolean> {
  if (seasonSlug === "august_finals") {
    const rows = await getPublishedStandings(seasonId);
    return rows.length > 0;
  }
  for (const region of REGIONS) {
    const rows = await getPublishedStandings(seasonId, region);
    if (rows.length > 0) return true;
  }
  return false;
}

async function resolveDataMilestone(
  config: CompetitionMapConfig
): Promise<{
  dataMilestoneId: CompetitionMilestoneId;
  dataMismatch: boolean;
  mismatchMessage: string | null;
}> {
  const mapMeta = getMilestoneMeta(config.milestoneId);

  if (!mapMeta.seasonSlug || !isSupabaseConfigured()) {
    return {
      dataMilestoneId: config.milestoneId,
      dataMismatch: false,
      mismatchMessage: null,
    };
  }

  const mapSeason = await getSeasonBySlug(mapMeta.seasonSlug);
  if (mapSeason && (await seasonHasPublishedRows(mapSeason.id, mapMeta.seasonSlug))) {
    return {
      dataMilestoneId: config.milestoneId,
      dataMismatch: false,
      mismatchMessage: null,
    };
  }

  const latest = await getLatestPublishedRoundInfo();
  if (!latest) {
    return {
      dataMilestoneId: config.milestoneId,
      dataMismatch: false,
      mismatchMessage: null,
    };
  }

  const effectiveId = milestoneIdForSeasonRound(
    latest.seasonSlug,
    latest.roundNumber
  );
  if (!effectiveId || effectiveId === config.milestoneId) {
    return {
      dataMilestoneId: config.milestoneId,
      dataMismatch: false,
      mismatchMessage: null,
    };
  }

  const livePhase = seasonPhaseLabel(latest.seasonSlug);
  const mapPhase = mapMeta.seasonSlug
    ? seasonPhaseLabel(mapMeta.seasonSlug)
    : mapMeta.label;

  return {
    dataMilestoneId: effectiveId,
    dataMismatch: true,
    mismatchMessage: `Map chapter is set to ${mapPhase}, but the latest published standings are ${livePhase} Round ${latest.roundNumber}. Showing the live roster below — sync Admin → Competition map when ready.`,
  };
}

export async function getRemainingContestantsForMap(
  config: CompetitionMapConfig
): Promise<RemainingContestantsResult> {
  const { dataMilestoneId, dataMismatch, mismatchMessage } =
    await resolveDataMilestone(config);
  const meta = getMilestoneMeta(dataMilestoneId);

  const empty: RemainingContestantsResult = {
    groups: [],
    totalCount: 0,
    seasonSlug: meta.seasonSlug,
    configured: isSupabaseConfigured(),
    mapMilestoneId: config.milestoneId,
    dataMilestoneId,
    dataMismatch,
    mismatchMessage,
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
    if (rows.length > 0) {
      const capped = capGroup(rows, meta.seasonSlug, highlight);
      groups.push({
        region: highlight,
        regionLabel: REGION_LABELS[highlight],
        ...capped,
      });
    }
  } else {
    const rows = filterRemaining(
      await fetchForRegion(season.id, meta.seasonSlug, undefined)
    );
    if (rows.length > 0) {
      const capped = capGroup(rows, meta.seasonSlug, null);
      groups.push({
        region: null,
        regionLabel: "Nationals field",
        ...capped,
      });
    }
  }

  const totalCount = groups.reduce((n, g) => n + g.totalInRegion, 0);
  return {
    groups,
    totalCount,
    seasonSlug: meta.seasonSlug,
    configured: true,
    mapMilestoneId: config.milestoneId,
    dataMilestoneId,
    dataMismatch,
    mismatchMessage,
  };
}
