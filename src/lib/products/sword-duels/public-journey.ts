import { getSdNationalsContext } from "./nationals-queries";
import { getSdPublicOverview } from "./public-queries";
import { getSdEvent } from "./queries";

export type SdPublicJourneyPhase = "areas" | "wildcard" | "knockout";

export interface SdPublicJourneyState {
  areasPublished: number;
  totalAreas: number;
  areasComplete: boolean;
  /** Active nationals sub-phase once all area finals are in. */
  nationalsPhase: SdPublicJourneyPhase | null;
  knockoutComplete: boolean;
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

  let nationalsPhase: SdPublicJourneyPhase | null = null;
  let knockoutComplete = false;

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

  return {
    areasPublished,
    totalAreas,
    areasComplete: totalAreas > 0 && areasPublished >= totalAreas,
    nationalsPhase,
    knockoutComplete,
  };
}
