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
      ? "National finals"
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
    hint = "August championship standings";
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
