export const SCORING_CONFIG = {
  june_area: {
    slug: "june_area" as const,
    name: "June — Area-wide",
    roundCount: 3,
    advancementCount: 24,
    participantSource: "all_branches" as const,
  },
  july_region: {
    slug: "july_region" as const,
    name: "July — Region-wide",
    roundCount: 3,
    advancementPerRegion: 1,
    participantSource: "june_top_24" as const,
  },
  august_finals: {
    slug: "august_finals" as const,
    name: "August — Finals",
    roundCount: 3,
    advancementCount: 1,
    participantSource: "july_regional_champions" as const,
  },
} as const;

export type SeasonSlug = keyof typeof SCORING_CONFIG;

export const REGIONS = ["luzon", "ncr", "vismin"] as const;
export type Region = (typeof REGIONS)[number];

export const REGION_LABELS: Record<Region, string> = {
  luzon: "Luzon",
  ncr: "NCR",
  vismin: "VisMin",
};

export const TIE_BREAKER_LABELS = [
  "Total points",
  "Round 3 points",
  "Round 2 points",
  "Total wins",
  "Branch name (A–Z)",
];
