import type { Region } from "@/lib/scoring-config";
import { REGIONS } from "@/lib/scoring-config";
import type { NationalsEntrant } from "./nationals-entrant";
import type { RegionalStandingRow } from "./regional-standings";
import { buildRegionalStandings } from "./regional-standings";
import type { NationalsAreaRep } from "./nationals-wildcard-data";
import type { SdSet, SdSetScore } from "./types";

const REGION_SLOT_LABEL: Record<Region, string> = {
  luzon: "Luzon champion",
  ncr: "NCR champion",
  vismin: "VisMin champion",
};

export function entrantFromRegionalChampion(
  row: RegionalStandingRow,
  region: Region
): NationalsEntrant {
  return {
    id: row.branchId,
    area: row.area,
    slotLabel: REGION_SLOT_LABEL[region],
    region,
    repName: row.repName,
    branchName: row.branchName,
    branchCode: row.branchCode,
    employeeNo: row.employeeNo,
    position: row.position,
    photoUrl: row.photoUrl,
    isWildcard: false,
    areaFinalScore: row.average ?? 0,
  };
}

export function buildV2KnockoutEntrants(input: {
  areaReps: NationalsAreaRep[];
  sets: SdSet[];
  scoreMap: Map<string, SdSetScore[]>;
}): NationalsEntrant[] {
  const entrants: NationalsEntrant[] = [];

  for (const region of REGIONS) {
    const standings = buildRegionalStandings({
      region,
      areaReps: input.areaReps,
      sets: input.sets,
      scoreMap: input.scoreMap,
    });
    if (!standings.champion) continue;
    entrants.push(
      entrantFromRegionalChampion(standings.champion, region)
    );
  }

  return entrants;
}

export function v2FinalsFieldLocked(input: {
  areaReps: NationalsAreaRep[];
  sets: SdSet[];
  scoreMap: Map<string, SdSetScore[]>;
  totalAreas: number;
}): boolean {
  if (input.areaReps.length < input.totalAreas) return false;
  return buildV2KnockoutEntrants(input).length === REGIONS.length;
}
