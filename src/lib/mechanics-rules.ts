import {
  getRoundMechanics,
  getSurvivorCount,
  REGION_LABELS,
  REGIONS,
  SCORING_CONFIG,
  TIE_BREAKER_LABELS,
  type Region,
  type SeasonSlug,
} from "@/lib/scoring-config";

export function getPhaseOverviewRows() {
  return [
    {
      phase: "June",
      season: "Area-wide",
      participants: "All branches (130+)",
      rounds: "3 weekly",
      advancement: "8 per region after R3 → 24 to July",
      anchor: "june",
    },
    {
      phase: "July",
      season: "Regional",
      participants: "24 from June",
      rounds: "3 per region",
      advancement: "1 champion per region → August",
      anchor: "july",
    },
    {
      phase: "August",
      season: "Finals",
      participants: "3 regional champions",
      rounds: "TBD",
      advancement: "1 overall champion",
      anchor: "august",
    },
  ];
}

export function getJuneSurvivorTable() {
  return [1, 2, 3].map((round) => {
    const per = REGIONS.map((r) => getSurvivorCount("june_area", round, r) ?? 0);
    const total = per.reduce((a, b) => a + b, 0);
    return {
      round,
      luzon: per[0],
      ncr: per[1],
      vismin: per[2],
      total,
      note: round === 3 ? "→ July" : "",
    };
  });
}

export function getJulySurvivorTable() {
  return [1, 2, 3].map((round) => {
    const per = REGIONS.map((r) => getSurvivorCount("july_region", round, r) ?? 0);
    const total = per.reduce((a, b) => a + b, 0);
    return {
      round,
      perRegion: per[0],
      total,
      note: round === 3 ? "→ August" : "",
    };
  });
}

export function getRoundCapRows() {
  const rows: { season: string; round: string; format: string; max: string }[] =
    [];
  for (const slug of ["june_area", "july_region"] as SeasonSlug[]) {
    const name = SCORING_CONFIG[slug].name.split(" — ")[0];
    for (let r = 1; r <= 3; r++) {
      const m = getRoundMechanics(slug, r);
      if (m) {
        rows.push({
          season: name,
          round: `Round ${r}`,
          format: m.label.replace(/^Round \d+ — /, ""),
          max: String(m.maxPoints),
        });
      }
    }
  }
  return rows;
}

export const STATUS_GLOSSARY = [
  { status: "Active / advancing", meaning: "Still competing — advancing to next round" },
  {
    status: "Committee pick",
    meaning:
      'Manually added after the automatic cut — badge shows "Advancing to R*n* (committee pick)"',
  },
  { status: "Advanced", meaning: "Survived June R3 (8 per region)" },
  { status: "Eliminated", meaning: 'Out after a specific round (e.g. "Eliminated — R1")' },
  { status: "Regional finalist", meaning: "Won July R3 in their region" },
  { status: "Champion", meaning: "August winner" },
];

export { REGION_LABELS, TIE_BREAKER_LABELS };
