import type { Region } from "./scoring-config";

export interface ManualAdvance {
  round_number: number;
  region: Region;
  branch_id: string;
}

export function manualAdvancesForRound(
  advances: ManualAdvance[],
  roundNumber: number,
  region: Region
): Set<string> {
  return new Set(
    advances
      .filter((a) => a.round_number === roundNumber && a.region === region)
      .map((a) => a.branch_id)
  );
}

export function manualAdvancesForSeason(advances: ManualAdvance[]): ManualAdvance[] {
  return advances;
}
