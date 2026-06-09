import type { Region } from "@/lib/scoring-config";
import { REGIONS, REGION_LABELS } from "@/lib/scoring-config";
import type { NationalsAreaRep } from "./nationals-wildcard-data";
import {
  SD_REGIONAL_SET_ORDER,
  type SdRegionalSetType,
  regionalAreaReps,
} from "./regional-rounds";
import type { SdSet, SdSetScore } from "./types";

export interface RegionalStandingRow {
  rank: number;
  branchId: string;
  area: string;
  branchName: string;
  branchCode: string;
  repName: string;
  employeeNo: string | null;
  position: string | null;
  photoUrl: string | null;
  roundScores: (number | null)[];
  roundsPlayed: number;
  average: number | null;
  isChampion: boolean;
}

export interface RegionalStandingsModel {
  region: Region;
  label: string;
  rows: RegionalStandingRow[];
  champion: RegionalStandingRow | null;
  roundsPublished: number;
  allRoundsPublished: boolean;
  readyForFinals: boolean;
}

function scoresForRegionalSet(
  setId: string | undefined,
  scoreMap: Map<string, SdSetScore[]>
): Map<string, number> {
  const map = new Map<string, number>();
  if (!setId) return map;
  for (const row of scoreMap.get(setId) ?? []) {
    map.set(row.branch_id, row.points);
  }
  return map;
}

export function buildRegionalStandings(input: {
  region: Region;
  areaReps: NationalsAreaRep[];
  sets: SdSet[];
  scoreMap: Map<string, SdSetScore[]>;
}): RegionalStandingsModel {
  const reps = regionalAreaReps(input.areaReps, input.region);
  const regionalSets = SD_REGIONAL_SET_ORDER.map((setType) =>
    input.sets.find(
      (s) => s.area === input.region && s.set_type === setType
    )
  );

  const roundsPublished = regionalSets.filter(
    (s) => s?.status === "published"
  ).length;
  const allRoundsPublished = roundsPublished === SD_REGIONAL_SET_ORDER.length;

  const roundScoreMaps = regionalSets.map((set) =>
    set?.status === "published"
      ? scoresForRegionalSet(set.id, input.scoreMap)
      : new Map<string, number>()
  );

  const rows: RegionalStandingRow[] = reps.map((rep) => {
    const roundScores = roundScoreMaps.map((m) =>
      m.has(rep.branchId) ? m.get(rep.branchId)! : null
    );
    const played = roundScores.filter((s) => s != null) as number[];
    const average =
      played.length > 0
        ? played.reduce((sum, n) => sum + n, 0) / played.length
        : null;

    return {
      rank: 0,
      branchId: rep.branchId,
      area: rep.area,
      branchName: rep.branchName,
      branchCode: rep.branchCode,
      repName: rep.repName,
      employeeNo: rep.employeeNo,
      position: rep.position,
      photoUrl: rep.photoUrl ?? null,
      roundScores,
      roundsPlayed: played.length,
      average,
      isChampion: false,
    };
  });

  rows.sort((a, b) => {
    const avgA = a.average ?? -1;
    const avgB = b.average ?? -1;
    if (avgB !== avgA) return avgB - avgA;
    return a.area.localeCompare(b.area, undefined, { numeric: true });
  });

  rows.forEach((row, i) => {
    row.rank = i + 1;
  });

  const champion =
    allRoundsPublished && rows[0]?.average != null ? rows[0] : null;
  if (champion) champion.isChampion = true;

  return {
    region: input.region,
    label: REGION_LABELS[input.region],
    rows,
    champion,
    roundsPublished,
    allRoundsPublished,
    readyForFinals: false,
  };
}

export function allRegionalChampionsReady(input: {
  areaReps: NationalsAreaRep[];
  sets: SdSet[];
  scoreMap: Map<string, SdSetScore[]>;
}): boolean {
  return REGIONS.every((region) => {
    const model = buildRegionalStandings({
      region,
      areaReps: input.areaReps,
      sets: input.sets,
      scoreMap: input.scoreMap,
    });
    return model.allRoundsPublished && model.champion != null;
  });
}

export type { SdRegionalSetType };
