import { buildNationalsKnockoutBracket } from "./nationals-knockout-bracket";
import type { NationalsKnockoutModel } from "./nationals-knockout-bracket";
import { mergeKnockoutDbState } from "./merge-knockout-model";
import { loadKnockoutBracketState } from "./knockout-sync";
import { loadNationalsRoster } from "./nationals-wildcard-data";
import { allRegionalChampionsReady } from "./regional-standings";
import { buildRegionalStandings } from "./regional-standings";
import {
  getSdSetsForEvent,
  getSdSetScores,
  scoresBySetId,
} from "./queries";
import { buildV2KnockoutEntrants, v2FinalsFieldLocked } from "./v2-nationals";
import { REGIONS } from "@/lib/scoring-config";

export interface V2NationalsPublicView {
  roster: Awaited<ReturnType<typeof loadNationalsRoster>>;
  regionalStandings: ReturnType<typeof buildRegionalStandings>[];
  finalsFieldLocked: boolean;
  knockoutModel: NationalsKnockoutModel;
  knockoutIsLive: boolean;
}

export async function loadV2NationalsPublicView(
  eventId: string,
  options?: { admin?: boolean }
): Promise<V2NationalsPublicView> {
  const publicView = !options?.admin;
  const [roster, sets] = await Promise.all([
    loadNationalsRoster(eventId),
    getSdSetsForEvent(eventId),
  ]);
  const regionalIds = sets
    .filter((s) => s.set_type.startsWith("regional_"))
    .map((s) => s.id);
  const scoreMap = scoresBySetId(await getSdSetScores(regionalIds));

  const regionalStandings = REGIONS.map((region) =>
    buildRegionalStandings({
      region,
      areaReps: roster.areaReps,
      sets,
      scoreMap,
    })
  );

  const finalsFieldLocked = v2FinalsFieldLocked({
    areaReps: roster.areaReps,
    sets,
    scoreMap,
    totalAreas: roster.totalAreaCount,
  });

  const entrants = buildV2KnockoutEntrants({
    areaReps: roster.areaReps,
    sets,
    scoreMap,
  });
  const baseKnockout = buildNationalsKnockoutBracket(entrants);

  let knockoutModel = baseKnockout;
  let knockoutIsLive = false;

  try {
    const ko = await loadKnockoutBracketState(eventId);
    if (
      ko.bracket &&
      ko.bracket.status !== "pending" &&
      (finalsFieldLocked || options?.admin)
    ) {
      const entrantByBranchId = new Map(entrants.map((e) => [e.id, e]));
      knockoutModel = mergeKnockoutDbState(
        baseKnockout,
        ko.matches,
        ko.scoresByMatchId,
        entrantByBranchId,
        { publicView }
      );
      knockoutIsLive = ko.matches.some((m) => m.status === "published");
    }
  } catch {
    /* migration 020 */
  }

  return {
    roster,
    regionalStandings,
    finalsFieldLocked,
    knockoutModel,
    knockoutIsLive,
  };
}

export { allRegionalChampionsReady };
