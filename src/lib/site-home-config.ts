import type { SdPublicJourneyState } from "@/lib/products/sword-duels/public-journey";

export const SITE_HOME_CONFIG_SLUG = "site_home";

export type FeaturedProgramMode =
  | "sword_duels"
  | "national_competitions"
  | "auto";

export type ResolvedFeaturedProgram =
  | "sword_duels"
  | "national_competitions";

export interface SiteHomeConfig {
  featuredProgram: FeaturedProgramMode;
  /** Optional override for the hero headline (both programs). */
  heroHeadlineOverride: string;
  /** Optional override for the hero subline (both programs). */
  heroSublineOverride: string;
}

export const DEFAULT_SITE_HOME_CONFIG: SiteHomeConfig = {
  featuredProgram: "sword_duels",
  heroHeadlineOverride: "",
  heroSublineOverride: "",
};

const FEATURED_MODES = new Set<FeaturedProgramMode>([
  "sword_duels",
  "national_competitions",
  "auto",
]);

export function parseSiteHomeConfigBody(raw: unknown): SiteHomeConfig {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_SITE_HOME_CONFIG };
  }
  const o = raw as Record<string, unknown>;
  const featuredProgram = FEATURED_MODES.has(
    o.featuredProgram as FeaturedProgramMode
  )
    ? (o.featuredProgram as FeaturedProgramMode)
    : DEFAULT_SITE_HOME_CONFIG.featuredProgram;

  return {
    featuredProgram,
    heroHeadlineOverride:
      typeof o.heroHeadlineOverride === "string"
        ? o.heroHeadlineOverride.trim()
        : "",
    heroSublineOverride:
      typeof o.heroSublineOverride === "string"
        ? o.heroSublineOverride.trim()
        : "",
  };
}

/** Pick which program owns the home hero. */
export function resolveFeaturedProgram(
  config: SiteHomeConfig,
  sdJourney: SdPublicJourneyState | null
): ResolvedFeaturedProgram {
  if (config.featuredProgram === "sword_duels") return "sword_duels";
  if (config.featuredProgram === "national_competitions") {
    return "national_competitions";
  }

  if (sdJourney && sdJourney.totalAreas > 0) {
    if (
      sdJourney.areasPublished > 0 ||
      sdJourney.areasComplete ||
      sdJourney.nationalsPhase
    ) {
      return "sword_duels";
    }
  }

  return "national_competitions";
}

export const FEATURED_PROGRAM_LABELS: Record<FeaturedProgramMode, string> = {
  sword_duels: "Sword Duels (always)",
  national_competitions: "National Competitions (always)",
  auto: "Auto — Sword Duels when area/nationals activity exists",
};
