export const REGIONS = ["luzon", "ncr", "vismin"] as const;
export type Region = (typeof REGIONS)[number];

export type SurvivorsPerRegion = Record<Region, number>;

export interface RoundSurvivors {
  round: number;
  perRegion: SurvivorsPerRegion;
}

const JUNE_SURVIVORS: RoundSurvivors[] = [
  { round: 1, perRegion: { luzon: 32, ncr: 32, vismin: 32 } },
  { round: 2, perRegion: { luzon: 16, ncr: 16, vismin: 16 } },
  { round: 3, perRegion: { luzon: 8, ncr: 8, vismin: 8 } },
];

const JULY_SURVIVORS: RoundSurvivors[] = [
  { round: 1, perRegion: { luzon: 4, ncr: 4, vismin: 4 } },
  { round: 2, perRegion: { luzon: 2, ncr: 2, vismin: 2 } },
  { round: 3, perRegion: { luzon: 1, ncr: 1, vismin: 1 } },
];

export const SCORING_CONFIG = {
  june_area: {
    slug: "june_area" as const,
    name: "June — Area-wide",
    roundCount: 3,
    advancementCount: 24,
    participantSource: "all_branches" as const,
    eliminationMode: "per_round_per_region" as const,
    eliminationRanking: "round_only" as const,
    survivorsPerRound: JUNE_SURVIVORS,
  },
  july_region: {
    slug: "july_region" as const,
    name: "July — Region-wide",
    roundCount: 3,
    advancementPerRegion: 1,
    participantSource: "june_top_24" as const,
    eliminationMode: "per_round_per_region" as const,
    eliminationRanking: "round_only" as const,
    survivorsPerRound: JULY_SURVIVORS,
  },
  august_finals: {
    slug: "august_finals" as const,
    name: "August — Finals",
    roundCount: 3,
    advancementCount: 1,
    participantSource: "july_regional_champions" as const,
    eliminationMode: "cumulative" as const,
  },
} as const;

export type SeasonSlug = keyof typeof SCORING_CONFIG;

export const REGION_LABELS: Record<Region, string> = {
  luzon: "Luzon",
  ncr: "NCR",
  vismin: "VisMin",
};

export const TIE_BREAKER_LABELS = [
  "Round points",
  "Wins in round",
  "Branch name (A–Z)",
];

export const CUMULATIVE_TIE_BREAKER_LABELS = [
  "Total points",
  "Round 3 points",
  "Round 2 points",
  "Total wins",
  "Branch name (A–Z)",
];

export function getSurvivorCount(
  seasonSlug: SeasonSlug,
  round: number,
  region: Region
): number | null {
  const config = SCORING_CONFIG[seasonSlug];
  if (!("survivorsPerRound" in config)) return null;
  const entry = config.survivorsPerRound.find((s) => s.round === round);
  return entry?.perRegion[region] ?? null;
}

export function usesPerRoundElimination(seasonSlug: SeasonSlug): boolean {
  const config = SCORING_CONFIG[seasonSlug];
  return "eliminationMode" in config && config.eliminationMode === "per_round_per_region";
}
