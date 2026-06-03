import {
  getMilestoneMeta,
  milestonePhaseTab,
  regionBoardPath,
  seasonSlugToPublicPath,
  type CompetitionMapConfig,
} from "@/lib/competition-map";
import { REGION_LABELS, type Region, type SeasonSlug } from "@/lib/scoring-config";

const DEFAULT_REGION: Region = "luzon";

/** Public board URL driven by Admin → Competition map milestone (not last CSV export). */
export function resolvePublicStandingsHref(
  config: CompetitionMapConfig
): string {
  const meta = getMilestoneMeta(config.milestoneId);
  const region: Region =
    config.regionHighlight === "all"
      ? DEFAULT_REGION
      : config.regionHighlight;

  if (meta.id === "pre_season") {
    return regionBoardPath("june_area", region);
  }

  if (
    meta.group === "august" ||
    meta.group === "end" ||
    meta.id === "july_to_august"
  ) {
    return seasonSlugToPublicPath("august_finals");
  }

  if (meta.id === "june_to_july") {
    return regionBoardPath("july_region", region);
  }

  if (meta.seasonSlug === "june_area") {
    return regionBoardPath("june_area", region);
  }

  if (meta.seasonSlug === "july_region") {
    return regionBoardPath("july_region", region);
  }

  return seasonSlugToPublicPath("august_finals");
}

/** Phase hub URL (June / July / August landing) for the current map milestone. */
export function resolvePublicPhaseHref(config: CompetitionMapConfig): string {
  const tab = milestonePhaseTab(config.milestoneId);
  return seasonSlugToPublicPath(
    tab === "june"
      ? "june_area"
      : tab === "july"
        ? "july_region"
        : "august_finals"
  );
}

export function parsePublicStandingsPath(href: string): {
  seasonSlug: SeasonSlug;
  region?: Region;
} {
  if (href === "/august" || href.startsWith("/august?")) {
    return { seasonSlug: "august_finals" };
  }
  const match = href.match(/^\/(june|july)\/(luzon|ncr|vismin)/);
  if (match) {
    const phase = match[1];
    const region = match[2] as Region;
    return {
      seasonSlug: phase === "june" ? "june_area" : "july_region",
      region,
    };
  }
  return { seasonSlug: "june_area", region: DEFAULT_REGION };
}

/** Map a live standings/phase URL to its preview equivalent. */
export function toPreviewPath(liveHref: string): string {
  if (liveHref === "/august" || liveHref.startsWith("/august?")) {
    return "/preview/august";
  }
  if (liveHref === "/june") return "/preview/june";
  if (liveHref === "/july") return "/preview/july";
  const regional = liveHref.match(/^\/(june|july)\/(luzon|ncr|vismin)/);
  if (regional) {
    return `/preview/${regional[1]}/${regional[2]}`;
  }
  return "/preview/june/luzon";
}

export function standingsNavLabel(config: CompetitionMapConfig): string {
  const meta = getMilestoneMeta(config.milestoneId);
  if (meta.group === "august" || meta.group === "end") {
    return "Finals";
  }
  const phase =
    meta.seasonSlug === "july_region"
      ? "July"
      : meta.seasonSlug === "august_finals"
        ? "August"
        : "June";
  const regionLabel =
    config.regionHighlight === "all"
      ? ""
      : ` · ${REGION_LABELS[config.regionHighlight]}`;
  return `${phase}${regionLabel}`;
}
