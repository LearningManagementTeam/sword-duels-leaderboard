import type { SeasonSlug } from "@/lib/scoring-config";

export function getPhaseHighlights(slug: SeasonSlug): string[] {
  switch (slug) {
    case "june_area":
      return [
        "R1 Bingo Phallanx: 10-question quiz (0–10 per branch)",
        "R2 Last KaBingoPlus Standing: 16 survivors per region — no public score",
        "R3 Clash of the Knowledge Swords: first 8 to 5 correct — finish order matters",
        "Top 24 branches (8 × 3 regions) advance to July",
      ];
    case "july_region":
      return [
        "R1 Regional quiz: 15 questions (0–15)",
        "R2 Last standing: 2 survivors per region",
        "R3 Regional clash: first to 5 correct wins the region",
      ];
    default:
      return [
        "August finals — regional champions",
        "Champion crowned from published standings",
      ];
  }
}
