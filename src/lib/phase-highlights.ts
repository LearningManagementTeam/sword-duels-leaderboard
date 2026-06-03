import type { SeasonSlug } from "@/lib/scoring-config";

export function getPhaseHighlights(slug: SeasonSlug): string[] {
  switch (slug) {
    case "june_area":
      return [
        "June R1: quiz points only — no wins/losses",
        "Top 32 per region advance after Round 1 (preferred cut)",
        "Tied at the cut? Tie breaker round, then committee picks",
        "Points tie-break: higher total, then branch name A–Z",
        "After R3: top 24 branches advance to July",
      ];
    case "july_region":
      return [
        "July: regional competition among June survivors",
        "Top 4 per region after Round 3 advance toward August",
        "Tie breaker status for branches tied at the regional cut",
        "Points-only scoring each round",
      ];
    default:
      return [
        "August finals — regional champions",
        "Champion crowned from published standings",
      ];
  }
}
