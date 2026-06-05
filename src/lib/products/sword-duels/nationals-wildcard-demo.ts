import type { Region } from "@/lib/scoring-config";
import type { WildcardLoser } from "./wildcard-selection";

export interface NationalsAreaRep {
  area: string;
  region: Region;
  repName: string;
  branchLabel: string;
  finalScore: number;
}

export interface NationalsFinalLoser extends WildcardLoser {
  region: Region;
  branchLabel: string;
}

const PLACEHOLDER_NAMES = [
  "Marck Santos",
  "Via Reyes",
  "Ruby Cruz",
  "Mich Tan",
  "Jill Ramos",
  "Sheila Lim",
  "Charm Velasco",
  "Nico Garcia",
  "Ella Mendoza",
  "Kai Torres",
  "Luna Aquino",
  "Owen Castillo",
  "Pia Navarro",
  "Rex Villanueva",
  "Sage Dela Rosa",
];

const RUNNER_UP_NAMES = [
  "Alex Rivera",
  "Bea Flores",
  "Cara Santos",
  "Drew Ng",
  "Evan Cruz",
  "Faith Lim",
  "Gio Tan",
  "Hana Reyes",
  "Ivy Ramos",
  "Jude Garcia",
  "Kira Mendoza",
  "Leo Torres",
  "Maya Aquino",
  "Noah Castillo",
  "Olive Navarro",
];

/** Scores crafted so three runners-up tie at 6 — the 2nd-highest loser tier. */
const RUNNER_UP_SCORES = [7, 7, 6, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1];

function regionForArea(n: number): Region {
  if (n <= 6) return "luzon";
  if (n <= 12) return "ncr";
  return "vismin";
}

function buildDemoAreas(): {
  reps: NationalsAreaRep[];
  losers: NationalsFinalLoser[];
} {
  const reps: NationalsAreaRep[] = [];
  const losers: NationalsFinalLoser[] = [];

  for (let i = 1; i <= 15; i++) {
    const area = `Area ${i}`;
    const region = regionForArea(i);
    const runnerScore = RUNNER_UP_SCORES[i - 1] ?? 3;
    const repName = PLACEHOLDER_NAMES[i - 1] ?? `Rep ${i}`;
    const loserName = RUNNER_UP_NAMES[i - 1] ?? `Runner ${i}`;

    reps.push({
      area,
      region,
      repName,
      branchLabel: `${area} Branch`,
      finalScore: runnerScore + 2,
    });

    losers.push({
      id: `loser-area-${i}`,
      area,
      region,
      repName: loserName,
      branchLabel: `${area} Runner-up`,
      areaFinalScore: runnerScore,
    });
  }

  return { reps, losers };
}

export const DEMO_NATIONALS = buildDemoAreas();
export const DEMO_AREA_REPS = DEMO_NATIONALS.reps;
export const DEMO_FINAL_LOSERS = DEMO_NATIONALS.losers;

export const NATIONALS_REP_COUNT = 15;
export const NATIONALS_WILDCARD_SLOT = 16;

export const WILDCARD_PREVIEW_STORAGE_KEY = "sd-nationals-wildcard-preview-v1";

export interface WildcardPreviewState {
  /** Admin override: force tiebreak even when auto-select would apply */
  forceTiebreak?: boolean;
  /** Scores entered for wildcard round candidates (id → points) */
  wildcardScores: Record<string, number>;
  /** Manually confirmed wildcard winner id (from tiebreak publish) */
  confirmedWildcardId?: string;
}

export const DEFAULT_WILDCARD_PREVIEW_STATE: WildcardPreviewState = {
  wildcardScores: {},
};
