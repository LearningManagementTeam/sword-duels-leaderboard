import type { Region } from "@/lib/scoring-config";
import type { NationalsAreaRep } from "./nationals-wildcard-data";
import {
  buildPlaceholderNationalsEntrants,
  entrantFromAreaRep,
  type NationalsEntrant,
} from "./nationals-entrant";
import type { NationalsWildcardModel } from "./build-nationals-wildcard-model";
import { buildNationalsKnockoutBracket } from "./nationals-knockout-bracket";

export function buildKnockoutEntrantsFromModel(
  model: NationalsWildcardModel
): NationalsEntrant[] {
  const entrants: NationalsEntrant[] = model.areaReps.map(entrantFromAreaRep);

  if (model.wildcardRep) {
    const loser = model.losers.find((l) => l.id === model.wildcardRep!.id);
    entrants.push({
      id: model.wildcardRep.id,
      area: model.wildcardRep.area,
      slotLabel: "Wild card",
      region: (loser?.region ?? "ncr") as Region,
      repName: model.wildcardRep.repName,
      branchName: loser?.branchLabel ?? model.wildcardRep.area,
      branchCode: loser?.branchCode ?? "",
      employeeNo: loser?.employeeNo ?? null,
      position: loser?.position ?? null,
      isWildcard: true,
      areaFinalScore: model.wildcardRep.areaFinalScore,
    });
  }

  return entrants;
}

export function buildKnockoutFromNationalsModel(model: NationalsWildcardModel) {
  const entrants = buildKnockoutEntrantsFromModel(model);
  if (entrants.length < 2) {
    return buildNationalsKnockoutBracket([]);
  }
  return buildNationalsKnockoutBracket(entrants);
}

/** Merge live reps with placeholders for unfilled slots (preview-style). */
export function buildHybridKnockoutEntrants(
  liveReps: NationalsAreaRep[],
  totalAreas: number,
  wildcard: NationalsEntrant | null
): NationalsEntrant[] {
  const placeholders = buildPlaceholderNationalsEntrants();
  const byArea = new Map(liveReps.map((r) => [r.area, entrantFromAreaRep(r)]));

  const entrants: NationalsEntrant[] = [];
  for (let i = 1; i <= totalAreas; i++) {
    const area = `Area ${i}`;
    entrants.push(byArea.get(area) ?? placeholders[i - 1]!);
  }

  entrants.push(
    wildcard ??
      placeholders[placeholders.length - 1]!
  );

  return entrants;
}
