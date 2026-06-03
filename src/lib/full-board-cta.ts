import {
  getMilestoneMeta,
  type CompetitionMilestoneId,
} from "@/lib/competition-map";
import {
  juneRoundDisplayName,
  type Region,
  type SeasonSlug,
} from "@/lib/scoring-config";

export interface FullBoardCta {
  href: string;
  ctaLine: string;
  subtitle: string;
}

export function buildScopeLabel(
  branchCount: number,
  formatCount: (n: number) => string
): string {
  return branchCount > 0
    ? `${formatCount(branchCount)} · all regions`
    : "All regions";
}

/** Home secondary CTA — phase-aware full or regional board destination. */
export function resolveFullBoardCta(
  milestoneId: CompetitionMilestoneId,
  junePublishedRound: number,
  scopeLabel: string
): FullBoardCta {
  const meta = getMilestoneMeta(milestoneId);
  const exploreSuffix = `${scopeLabel} · more room to climb the ranks`;

  if (
    meta.group === "august" ||
    meta.group === "end" ||
    meta.id === "july_to_august"
  ) {
    return {
      href: "/august",
      ctaLine: "Go to finals board",
      subtitle: `${scopeLabel} · August championship`,
    };
  }

  if (meta.seasonSlug === "july_region" || meta.id === "june_to_july") {
    return {
      href: "/july/luzon",
      ctaLine: "Go to regional leaderboard",
      subtitle: `July · pick a region · ${exploreSuffix}`,
    };
  }

  if (junePublishedRound >= 3) {
    return {
      href: "/june/leaderboard",
      ctaLine: "Go to full leaderboard",
      subtitle: `${juneRoundDisplayName(3)} · three regions side-by-side · ${exploreSuffix}`,
    };
  }

  const roundName =
    junePublishedRound > 0
      ? juneRoundDisplayName(junePublishedRound as 1 | 2)
      : "Round 1";

  return {
    href: "/june/luzon",
    ctaLine: "Go to regional leaderboard",
    subtitle: `${roundName} · pick a region · ${exploreSuffix}`,
  };
}

/** “See the full arena” link from home preview snippet. */
export function resolveArenaHref(
  seasonSlug: SeasonSlug,
  latestPublishedRound: number,
  region?: Region
): string {
  if (seasonSlug === "august_finals") return "/august";
  if (seasonSlug === "july_region") {
    return region ? `/july/${region}` : "/july/luzon";
  }
  if (seasonSlug === "june_area") {
    if (latestPublishedRound >= 3) return "/june/leaderboard";
    return region ? `/june/${region}` : "/june/luzon";
  }
  return "/june/luzon";
}
