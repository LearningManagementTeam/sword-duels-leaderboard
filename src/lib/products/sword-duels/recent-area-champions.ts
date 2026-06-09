import { areaSetsForBracket } from "./public-queries";
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
      const areaSets = areaSetsForBracket(sets, fin.area);
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

export {
  sdJourneyHeadline,
  sdJourneySubline,
  sdJourneyShortPath,
  sdProgressLine,
} from "./journey-copy";
