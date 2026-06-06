import { resolveAreaChampionDisplayName } from "./public-area-summary";
import type { SdAreaBracket, SdSet, SdSetScore } from "./types";

export interface SdRecentAreaChampion {
  area: string;
  championName: string;
  publishedAt: string;
}

export function getRecentAreaChampions(
  brackets: SdAreaBracket[],
  sets: SdSet[],
  scoreMap: Map<string, SdSetScore[]>,
  limit = 3
): SdRecentAreaChampion[] {
  const finals = sets
    .filter(
      (s) =>
        s.set_type === "area_final" &&
        s.status === "published" &&
        s.published_at
    )
    .sort(
      (a, b) =>
        new Date(b.published_at!).getTime() -
        new Date(a.published_at!).getTime()
    )
    .slice(0, limit);

  return finals
    .map((fin) => {
      const bracket = brackets.find((b) => b.area === fin.area);
      if (!bracket) return null;
      const areaSets = sets.filter((s) => s.area === fin.area);
      const championName = resolveAreaChampionDisplayName(
        areaSets,
        scoreMap,
        bracket
      );
      if (!championName) return null;
      return {
        area: fin.area,
        championName,
        publishedAt: fin.published_at!,
      };
    })
    .filter((row): row is SdRecentAreaChampion => row != null);
}

export function sdJourneyHeadline(
  journey: import("./public-journey").SdPublicJourneyState
): string {
  if (journey.knockoutComplete) return "National champion crowned";
  if (journey.nationalsPhase === "knockout") return "Nationals knockout";
  if (journey.areasComplete) return "Wild card phase";
  if (journey.totalAreas > 0) return "Area representative battles";
  return "Area tournaments";
}

export function sdJourneySubline(
  journey: import("./public-journey").SdPublicJourneyState
): string {
  if (journey.knockoutComplete) {
    return "The nationals bracket is complete — see the champion on the live map.";
  }
  if (journey.nationalsPhase === "knockout") {
    return "Area vs area knockout — results update as each match is published.";
  }
  if (journey.areasComplete) {
    return "All area reps are locked. Wild card and knockout follow on the nationals map.";
  }
  if (journey.totalAreas > 0) {
    return `${journey.areasPublished} of ${journey.totalAreas} area representatives crowned.`;
  }
  return "Two group battles per area — Spot 1 and Spot 2 fight for one area rep.";
}
