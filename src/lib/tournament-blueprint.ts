import { TARGET_BRANCH_COUNT } from "@/lib/branch-targets";
import {
  getRoundMechanics,
  SCORING_CONFIG,
  type Region,
  type SeasonSlug,
} from "@/lib/scoring-config";
import { PHASE_DISPLAY, type PhaseSlug } from "@/lib/season-labels";
import { seasonSlugToPublicPath } from "@/lib/competition-map";

export type TournamentBlueprintProgram = "national_competitions" | "sword_duels";

export interface TournamentBlueprintStep {
  id: string;
  title: string;
  subtitle: string;
  detail: string;
  cutLine?: string;
  href?: string;
}

export interface TournamentBlueprintPhase {
  id: PhaseSlug | "setup" | "sd_areas" | "sd_nationals";
  label: string;
  subtitle: string;
  steps: TournamentBlueprintStep[];
}

export interface TournamentBlueprintModel {
  program: TournamentBlueprintProgram;
  headline: string;
  tagline: string;
  phases: TournamentBlueprintPhase[];
}

function survivorCutLine(seasonSlug: SeasonSlug, round: number): string | undefined {
  const config = SCORING_CONFIG[seasonSlug];
  if (!("survivorsPerRound" in config)) return undefined;
  const entry = config.survivorsPerRound.find((s) => s.round === round);
  if (!entry) return undefined;
  const counts = (["luzon", "ncr", "vismin"] as Region[]).map(
    (r) => entry.perRegion[r]
  );
  if (counts.every((c) => c === counts[0])) {
    return `${counts[0]} per region`;
  }
  return counts.map((c, i) => `${c} ${(["Luzon", "NCR", "VisMin"] as const)[i]}`).join(" · ");
}

function buildNcRoundSteps(seasonSlug: SeasonSlug): TournamentBlueprintStep[] {
  const config = SCORING_CONFIG[seasonSlug];
  const steps: TournamentBlueprintStep[] = [];

  for (let round = 1; round <= config.roundCount; round++) {
    const mechanics = getRoundMechanics(seasonSlug, round);
    const cut = survivorCutLine(seasonSlug, round);
    steps.push({
      id: `${seasonSlug}-r${round}`,
      title: mechanics?.roundName ?? `Round ${round}`,
      subtitle: mechanics?.label ?? `Round ${round}`,
      detail: mechanics?.bannerTagline ?? mechanics?.description ?? "",
      cutLine: cut,
      href: seasonSlugToPublicPath(seasonSlug),
    });
  }

  if (seasonSlug === "june_area") {
    steps.push({
      id: "june-to-july",
      title: "June → July lock",
      subtitle: "Phase transition",
      detail: `Top ${SCORING_CONFIG.june_area.advancementCount} branches (8 per region) seed the July regional boards.`,
    });
  }

  if (seasonSlug === "july_region") {
    steps.push({
      id: "july-to-august",
      title: "July → Nationals lock",
      subtitle: "Phase transition",
      detail: "One regional champion per region (3 total) advance to The Nationals in August.",
      href: "/august",
    });
  }

  if (seasonSlug === "august_finals") {
    steps.push({
      id: "national-champion",
      title: "National champion crowned",
      subtitle: "Season finale",
      detail: "Cumulative standings across three finals rounds decide the one branch that takes the crown.",
      href: "/august",
    });
  }

  return steps;
}

/** Static National Competitions roadmap — full path from roster to national champion. */
export function buildNationalCompetitionsBlueprint(): TournamentBlueprintModel {
  return {
    program: "national_competitions",
    headline: "National Competitions — full season map",
    tagline: `Every branch starts in June. Three phases, nine scored rounds, one national champion.`,
    phases: [
      {
        id: "setup",
        label: "Before June",
        subtitle: "Roster & representatives",
        steps: [
          {
            id: "roster",
            title: "Branch roster live",
            subtitle: "All regions",
            detail: `~${TARGET_BRANCH_COUNT} branches across Luzon, NCR, and VisMin enter June Round 1.`,
            href: "/june/luzon",
          },
        ],
      },
      {
        id: "june",
        label: PHASE_DISPLAY.june.label,
        subtitle: PHASE_DISPLAY.june.subtitle,
        steps: buildNcRoundSteps("june_area"),
      },
      {
        id: "july",
        label: PHASE_DISPLAY.july.label,
        subtitle: PHASE_DISPLAY.july.subtitle,
        steps: buildNcRoundSteps("july_region"),
      },
      {
        id: "august",
        label: PHASE_DISPLAY.august.label,
        subtitle: PHASE_DISPLAY.august.subtitle,
        steps: buildNcRoundSteps("august_finals"),
      },
    ],
  };
}
