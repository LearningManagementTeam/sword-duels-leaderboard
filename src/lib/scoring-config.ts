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
    name: "The Nationals",
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
  "Round points (higher advances)",
  "Branch name (A–Z) for ties at the cut",
];

export const CUMULATIVE_TIE_BREAKER_LABELS = [
  "Total points",
  "Round 3 points",
  "Round 2 points",
  "Branch name (A–Z)",
];

export type RoundLayoutVariant =
  | "quiz_ladder"
  | "survival_roster"
  | "hearts_roster"
  | "finish_order_champions"
  | "percentage_score"
  | "judged_score"
  | "cumulative";

export type RoundMechanics =
  | {
      kind: "quiz";
      roundName: string;
      label: string;
      description: string;
      maxPoints: number;
      layoutVariant: "quiz_ladder";
      bannerTagline: string;
    }
  | {
      kind: "last_man_standing";
      roundName: string;
      label: string;
      description: string;
      layoutVariant: "survival_roster";
      bannerTagline: string;
    }
  | {
      kind: "hearts_survival";
      roundName: string;
      label: string;
      description: string;
      maxHearts: number;
      layoutVariant: "hearts_roster";
      bannerTagline: string;
    }
  | {
      kind: "race_to_correct";
      roundName: string;
      label: string;
      description: string;
      maxCorrect: number;
      layoutVariant: "finish_order_champions";
      bannerTagline: string;
    }
  | {
      kind: "lifelines_quiz";
      roundName: string;
      label: string;
      description: string;
      maxPoints: number;
      layoutVariant: "percentage_score";
      bannerTagline: string;
    }
  | {
      kind: "judged_round";
      roundName: string;
      label: string;
      description: string;
      layoutVariant: "judged_score";
      bannerTagline: string;
    };

export const JUDGED_SCORES = [0, 50, 100] as const;
export type JudgedScore = (typeof JUDGED_SCORES)[number];

export function judgedScoreLabel(score: number): string {
  if (score >= 100) return "Right";
  if (score >= 50) return "Incomplete";
  return "Wrong";
}

const ROUND_MECHANICS: Partial<
  Record<SeasonSlug, Partial<Record<number, RoundMechanics>>>
> = {
  june_area: {
    1: {
      kind: "quiz",
      roundName: "Bingo Phallanx",
      label: "Round 1 — Bingo Phallanx",
      description: "10-question quiz — enter 0–10 per branch",
      maxPoints: 10,
      layoutVariant: "quiz_ladder",
      bannerTagline: "10-question quiz · Top 32 advance to Last KaBingoPlus Standing",
    },
    2: {
      kind: "last_man_standing",
      roundName: "Last KaBingoPlus Standing",
      label: "Round 2 — Last KaBingoPlus Standing",
      description: "Mark exactly 16 survivors per region — no public score",
      layoutVariant: "survival_roster",
      bannerTagline: "Last 16 standing per region advance",
    },
    3: {
      kind: "race_to_correct",
      roundName: "Clash of the Knowledge Swords",
      label: "Round 3 — Clash of the Knowledge Swords",
      description: "First 8 per region to 5 correct — assign finish order 1–8",
      maxCorrect: 5,
      layoutVariant: "finish_order_champions",
      bannerTagline: "First 8 to qualify advance to July",
    },
  },
  july_region: {
    1: {
      kind: "quiz",
      roundName: "Regional Quiz Blitz",
      label: "Round 1 — 15-item quiz",
      description: "15-question quiz — highest scores fill the top 4 spots per region",
      maxPoints: 15,
      layoutVariant: "quiz_ladder",
      bannerTagline: "15-item quiz · Top 4 per region advance",
    },
    2: {
      kind: "hearts_survival",
      roundName: "Triple Heart Survival",
      label: "Round 2 — Triple heart survival",
      description: "Enter hearts remaining (0–3) — last 2 standing per region advance",
      maxHearts: 3,
      layoutVariant: "hearts_roster",
      bannerTagline: "3 hearts each · Last 2 standing per region advance",
    },
    3: {
      kind: "race_to_correct",
      roundName: "Regional Clash",
      label: "Round 3 — First to 5 correct",
      description: "First to 5 correct wins the region — assign finish order",
      maxCorrect: 5,
      layoutVariant: "finish_order_champions",
      bannerTagline: "First to 5 correct · Regional champion advances to The Nationals",
    },
  },
  august_finals: {
    1: {
      kind: "lifelines_quiz",
      roundName: "Lifelines Challenge",
      label: "Round 1 — Lifelines challenge",
      description: "Enter round score 0–100% — perfect run keeps all 3 lifelines with no wrong-answer deductions",
      maxPoints: 100,
      layoutVariant: "percentage_score",
      bannerTagline: "3 lifelines · Perfect run = 100%",
    },
    2: {
      kind: "judged_round",
      roundName: "Roleplay Round",
      label: "Round 2 — Roleplay (SME judges)",
      description: "Subject-matter expert judges score each answer: Right 100%, Incomplete 50%, Wrong 0%",
      layoutVariant: "judged_score",
      bannerTagline: "SME judges · Right 100% · Incomplete 50% · Wrong 0%",
    },
    3: {
      kind: "judged_round",
      roundName: "Q&A Finals",
      label: "Round 3 — Q&A finals",
      description: "Miss Universe–style Q&A — 3 judges score: Right 100%, Incomplete 50%, Wrong 0%",
      layoutVariant: "judged_score",
      bannerTagline: "3 judges · Q&A finals · Right / Incomplete / Wrong",
    },
  },
};

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

export function getRoundMechanics(
  seasonSlug: SeasonSlug,
  roundNumber: number
): RoundMechanics | null {
  return ROUND_MECHANICS[seasonSlug]?.[roundNumber] ?? null;
}

export function juneRoundDisplayName(round: 1 | 2 | 3): string {
  return getRoundMechanics("june_area", round)?.roundName ?? `Round ${round}`;
}

export function validateRoundPoints(
  seasonSlug: SeasonSlug,
  roundNumber: number,
  points: number
): string | null {
  if (points < 0) return "Points cannot be negative.";
  const mechanics = getRoundMechanics(seasonSlug, roundNumber);
  if (!mechanics) return null;

  if (mechanics.kind === "quiz" && points > mechanics.maxPoints) {
    return `Score cannot exceed ${mechanics.maxPoints} for ${mechanics.roundName}.`;
  }
  if (mechanics.kind === "lifelines_quiz" && points > mechanics.maxPoints) {
    return `Score cannot exceed ${mechanics.maxPoints}% for ${mechanics.roundName}.`;
  }
  if (mechanics.kind === "last_man_standing" && points !== 0 && points !== 1) {
    return "Use 1 for survived or 0 for out.";
  }
  if (
    mechanics.kind === "hearts_survival" &&
    (!Number.isInteger(points) || points < 0 || points > mechanics.maxHearts)
  ) {
    return `Hearts remaining must be 0–${mechanics.maxHearts}.`;
  }
  if (
    mechanics.kind === "judged_round" &&
    !JUDGED_SCORES.includes(points as JudgedScore)
  ) {
    return "Judge score must be 0 (Wrong), 50 (Incomplete), or 100 (Right).";
  }
  if (mechanics.kind === "race_to_correct" && points > mechanics.maxCorrect) {
    return `Correct answers cannot exceed ${mechanics.maxCorrect}.`;
  }
  return null;
}

export function validateFinishOrder(
  seasonSlug: SeasonSlug,
  roundNumber: number,
  finishOrder: number | null | undefined,
  points: number
): string | null {
  const mechanics = getRoundMechanics(seasonSlug, roundNumber);
  if (mechanics?.kind !== "race_to_correct") return null;
  if (finishOrder == null) return null;
  if (finishOrder < 1 || finishOrder > 32) {
    return "Finish order must be between 1 and 32.";
  }
  if (points !== mechanics.maxCorrect) {
    return "Finish order only applies to branches with full correct count.";
  }
  return null;
}

export function requiredSurvivorsPerRegion(
  seasonSlug: SeasonSlug,
  roundNumber: number,
  region: Region
): number | null {
  return getSurvivorCount(seasonSlug, roundNumber, region);
}
