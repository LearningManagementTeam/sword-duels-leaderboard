import { getSdAreaSchedules } from "@/lib/data/content-queries";
import { loadNationalsPublicView } from "./load-nationals-public-view";
import { loadV2NationalsPublicView } from "./load-v2-nationals-public-view";
import {
  areaSetsForBracket,
  filterPublicScores,
  getSdPublicOverview,
} from "./public-queries";
import { sortAreasByNumber } from "./area-groups";
import { isRegionalAverageFormat } from "./tournament-format";
import type { SdAreaBracket } from "./types";

export interface FullJourneyAreaSlice {
  bracket: SdAreaBracket;
  sets: ReturnType<typeof areaSetsForBracket>;
  publicScores: ReturnType<typeof filterPublicScores>;
  groupPublished: boolean;
  areaFinalPublished: boolean;
  anyPublished: boolean;
}

export async function loadFullJourneyView() {
  const overview = await getSdPublicOverview();
  if (!overview) return null;

  const schedules = await getSdAreaSchedules();
  const { event, brackets, sets, scoreMap } = overview;
  const isV2 = isRegionalAverageFormat(event.tournament_format);

  const areaOrder = sortAreasByNumber(brackets.map((b) => b.area));
  const sortedBrackets = [...brackets].sort(
    (a, b) => areaOrder.indexOf(a.area) - areaOrder.indexOf(b.area)
  );

  const areas: FullJourneyAreaSlice[] = sortedBrackets.map((bracket) => {
    const areaSets = areaSetsForBracket(sets, bracket.area);
    const publicScores = filterPublicScores(areaSets, scoreMap);
    const groupPublished = areaSets.some(
      (s) =>
        (s.set_type === "group_a" || s.set_type === "group_b") &&
        s.status === "published"
    );
    const areaFinalPublished = areaSets.some(
      (s) => s.set_type === "area_final" && s.status === "published"
    );
    return {
      bracket,
      sets: areaSets,
      publicScores,
      groupPublished,
      areaFinalPublished,
      anyPublished: groupPublished || areaFinalPublished,
    };
  });

  let v2Nationals: Awaited<ReturnType<typeof loadV2NationalsPublicView>> | null =
    null;
  let v1Nationals: Awaited<ReturnType<typeof loadNationalsPublicView>> | null =
    null;

  try {
    if (isV2) {
      v2Nationals = await loadV2NationalsPublicView(event.id);
    } else {
      v1Nationals = await loadNationalsPublicView(event.id);
    }
  } catch {
    /* nationals sections show empty state */
  }

  return {
    event,
    schedules,
    isV2,
    areas,
    v2Nationals,
    v1Nationals,
  };
}
