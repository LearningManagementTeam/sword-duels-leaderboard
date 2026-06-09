import { allRegionalChampionsReady } from "./regional-standings";
import { loadNationalsRoster } from "./nationals-wildcard-data";
import { getSdNationalsContext } from "./nationals-queries";
import { getSdPublicOverview } from "./public-queries";
import {
  getSdEvent,
  getSdSetsForEvent,
  getSdSetScores,
  scoresBySetId,
} from "./queries";
import { isRegionalAverageFormat } from "./tournament-format";

export type SdPublicJourneyPhase =
  | "areas"
  | "wildcard"
  | "regionals"
  | "knockout";

export interface SdPublicJourneyState {
  tournamentFormat: import("./tournament-format").SdTournamentFormat;
  areasPublished: number;
  totalAreas: number;
  areasComplete: boolean;
  /** Active nationals sub-phase once all area finals are in. */
  nationalsPhase: SdPublicJourneyPhase | null;
  knockoutComplete: boolean;
  regionalsComplete: boolean;
}

export async function loadPublicJourneyState(): Promise<SdPublicJourneyState | null> {
  const event = await getSdEvent();
  if (!event) return null;

  const overview = await getSdPublicOverview();
  if (!overview) return null;

  const totalAreas = overview.brackets.length;
  const areasPublished = overview.sets.filter(
    (s) => s.set_type === "area_final" && s.status === "published"
  ).length;

  const tournamentFormat = event.tournament_format ?? "classic_v1";
  let nationalsPhase: SdPublicJourneyPhase | null = null;
  let knockoutComplete = false;
  let regionalsComplete = false;

  const areasComplete = totalAreas > 0 && areasPublished >= totalAreas;

  if (isRegionalAverageFormat(tournamentFormat) && areasComplete) {
    try {
      const [roster, sets] = await Promise.all([
        loadNationalsRoster(event.id),
        getSdSetsForEvent(event.id),
      ]);
      const scoreMap = scoresBySetId(
        await getSdSetScores(
          sets.filter((s) => s.set_type.startsWith("regional_")).map((s) => s.id)
        )
      );
      regionalsComplete = allRegionalChampionsReady({
        areaReps: roster.areaReps,
        sets,
        scoreMap,
      });

      const { loadKnockoutBracketState } = await import("./knockout-sync");
      const ko = await loadKnockoutBracketState(event.id);
      knockoutComplete = ko.bracket?.status === "complete";
      if (knockoutComplete || ko.matches.some((m) => m.status === "published")) {
        nationalsPhase = "knockout";
      } else if (regionalsComplete) {
        nationalsPhase = "knockout";
      } else {
        nationalsPhase = "regionals";
      }
    } catch {
      nationalsPhase = "regionals";
    }
  } else {
    try {
      const ctx = await getSdNationalsContext(event.id);
      if (ctx.model.allFieldLocked) {
        knockoutComplete = ctx.knockoutBracket?.status === "complete";
        if (knockoutComplete) {
          nationalsPhase = "knockout";
        } else if (
          ctx.knockoutBracket?.status === "active" ||
          ctx.knockoutMatches.some((m) => m.status === "published")
        ) {
          nationalsPhase = "knockout";
        } else {
          nationalsPhase = "wildcard";
        }
      }
    } catch {
      /* nationals tables optional until migrations run */
    }
  }

  return {
    tournamentFormat,
    areasPublished,
    totalAreas,
    areasComplete,
    nationalsPhase,
    knockoutComplete,
    regionalsComplete,
  };
}
