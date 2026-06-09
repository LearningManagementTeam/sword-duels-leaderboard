import {
  getSdAreaBrackets,
  getSdEvent,
  getSdSetScores,
  getSdSetsForEvent,
  scoresBySetId,
} from "./queries";
import { isAreaSetType } from "./format-guards";
import type { SdAreaSet, SdSet } from "./types";

export async function getSdPublicOverview() {
  const event = await getSdEvent();
  if (!event) return null;

  const brackets = await getSdAreaBrackets(event.id);
  const sets = await getSdSetsForEvent(event.id);
  const publishedSets = sets.filter((s) => s.status === "published");
  const scoreRows = await getSdSetScores(publishedSets.map((s) => s.id));
  const scoreMap = scoresBySetId(scoreRows);

  return { event, brackets, sets, scoreMap };
}

export function areaSetsForBracket(sets: SdSet[], area: string): SdAreaSet[] {
  return sets.filter(
    (s): s is SdAreaSet => s.area === area && isAreaSetType(s.set_type)
  );
}

export async function getSdPublicArea(area: string) {
  const overview = await getSdPublicOverview();
  if (!overview) return null;

  const bracket = overview.brackets.find((b) => b.area === area);
  if (!bracket) return null;

  const areaSets = areaSetsForBracket(overview.sets, area);
  return {
    event: overview.event,
    bracket,
    sets: areaSets,
    scoreMap: overview.scoreMap,
  };
}

export function filterPublicScores(
  sets: SdSet[],
  scoreMap: Map<string, import("./types").SdSetScore[]>
) {
  const publicMap = new Map<string, import("./types").SdSetScore[]>();
  for (const set of sets) {
    if (set.status === "published" && set.id) {
      publicMap.set(set.id, scoreMap.get(set.id) ?? []);
    }
  }
  return publicMap;
}
