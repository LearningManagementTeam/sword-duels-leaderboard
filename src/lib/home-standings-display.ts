import { getRoundViewConfig } from "@/lib/leaderboard-display";
import type { CompetitionMilestoneId } from "@/lib/competition-map";
import { resolveFullBoardCta } from "@/lib/full-board-cta";
import {
  juneRoundDisplayName,
  REGION_LABELS,
  REGIONS,
  type Region,
  type SeasonSlug,
} from "@/lib/scoring-config";

export function seasonSlugToPhase(
  seasonSlug: SeasonSlug
): "june" | "july" | "august" {
  if (seasonSlug === "june_area") return "june";
  if (seasonSlug === "july_region") return "july";
  return "august";
}

/** Board sticky bar — phase/region badges + round line; no duplicate season title. */
export function buildBoardContextHeadline(
  seasonSlug: SeasonSlug,
  latestPublishedRound: number,
  region?: Region,
  fullBoardActive = false
): {
  phaseLabel: string;
  regionLabel: string | null;
  roundLine: string;
  mechanicsLine: string | null;
  scopeLine: string | null;
} {
  const phaseName =
    seasonSlugToPhase(seasonSlug).charAt(0).toUpperCase() +
    seasonSlugToPhase(seasonSlug).slice(1);
  const roundView = getRoundViewConfig(
    seasonSlug,
    latestPublishedRound,
    region
  );

  const roundLine =
    latestPublishedRound > 0
      ? roundView.roundName
      : "Round 1 kicks off soon — ranks appear after publish";

  const mechanicsLine =
    latestPublishedRound > 0 ? roundView.bannerTagline : null;

  if (fullBoardActive) {
    return {
      phaseLabel: phaseName,
      regionLabel: null,
      roundLine,
      mechanicsLine,
      scopeLine: "Luzon · NCR · VisMin · side-by-side",
    };
  }

  if (seasonSlug === "august_finals") {
    return {
      phaseLabel: phaseName,
      regionLabel: null,
      roundLine,
      mechanicsLine,
      scopeLine: "The Nationals · one-day · 3 rounds",
    };
  }

  return {
    phaseLabel: phaseName,
    regionLabel: region ? REGION_LABELS[region] : null,
    roundLine,
    mechanicsLine,
    scopeLine: null,
  };
}

/** Home hero copy — one phase name, no region bias, no milestone duplication. */
export function buildHomeArenaHeadline(
  seasonSlug: SeasonSlug,
  latestPublishedRound: number
): {
  phaseLabel: string;
  roundLine: string;
  scopeLine: string;
  mechanicsLine: string | null;
} {
  const phaseLabel = seasonSlugToPhase(seasonSlug);
  const phaseName =
    phaseLabel.charAt(0).toUpperCase() + phaseLabel.slice(1);
  const roundView = getRoundViewConfig(
    seasonSlug,
    latestPublishedRound,
    undefined
  );

  const roundLine =
    latestPublishedRound > 0
      ? roundView.roundName
      : `${roundView.roundName} · opens after first publish`;

  const scopeLine =
    seasonSlug === "august_finals"
      ? "The Nationals · one-day · 3 rounds"
      : "Luzon · NCR · VisMin";

  const mechanicsLine =
    latestPublishedRound > 0 ? roundView.bannerTagline : null;

  return {
    phaseLabel: phaseName,
    roundLine,
    scopeLine,
    mechanicsLine,
  };
}

export function resolveHomeStandingsCta(
  milestoneId: CompetitionMilestoneId,
  junePublishedRound: number,
  scopeLabel: string
): { href: string; label: string; hint: string } {
  const { href, ctaLine, subtitle } = resolveFullBoardCta(
    milestoneId,
    junePublishedRound,
    scopeLabel
  );

  let hint = "Live board · search, filters, and cut line";
  if (junePublishedRound >= 3 && href === "/june/leaderboard") {
    hint = "All three regions side-by-side";
  } else if (href.startsWith("/july")) {
    hint = "Pick Luzon, NCR, or VisMin on the board";
  } else if (href === "/august") {
    hint = "The Nationals · one-day championship";
  } else if (junePublishedRound > 0 && junePublishedRound < 3) {
    hint = `${juneRoundDisplayName(junePublishedRound as 1 | 2)} · choose your region on the board`;
  }

  return {
    href,
    label: "View standings",
    hint,
  };
}

export function regionalBoardLinks(
  seasonSlug: SeasonSlug
): { href: string; label: string; region: Region }[] | null {
  if (seasonSlug === "august_finals") return null;
  const phase = seasonSlugToPhase(seasonSlug);
  return REGIONS.map((region) => ({
    region,
    href: `/${phase}/${region}`,
    label: REGION_LABELS[region],
  }));
}
