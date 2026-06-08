import type { Region } from "@/lib/scoring-config";

export const SD_WILDCARD_AREA_NUMBER = 16;

export interface SdRegionalMapColumn {
  region: Region;
  label: string;
  pairs: readonly [number, number][];
  regionalNode: { id: string; label: string };
}

/** Static area → regional funnel (matches operator bracket diagram). */
export const SD_REGIONAL_TOURNAMENT_COLUMNS: SdRegionalMapColumn[] = [
  {
    region: "luzon",
    label: "LUZON",
    pairs: [
      [1, 2],
      [3, 4],
      [5, 6],
    ],
    regionalNode: { id: "luzon-r1", label: "R1" },
  },
  {
    region: "ncr",
    label: "NCR",
    pairs: [
      [7, 8],
      [9, 10],
      [11, 12],
    ],
    regionalNode: { id: "ncr-r2", label: "R2" },
  },
  {
    region: "vismin",
    label: "VISMIN",
    pairs: [
      [13, 14],
      [15, SD_WILDCARD_AREA_NUMBER],
    ],
    regionalNode: { id: "vismin-r3", label: "R3" },
  },
];

export function sdAreaNumber(area: string): number | null {
  const m = /area\s*(\d+)/i.exec(area.trim());
  return m ? Number.parseInt(m[1]!, 10) : null;
}

export function sdRegionForAreaNumber(n: number): Region {
  if (n <= 6) return "luzon";
  if (n <= 12) return "ncr";
  return "vismin";
}

export function isSdWildcardSlot(n: number): boolean {
  return n === SD_WILDCARD_AREA_NUMBER;
}

export function sdAreaShortLabel(n: number): string {
  return isSdWildcardSlot(n) ? "A16" : `A${n}`;
}

export function sdAreaFullName(n: number): string {
  return isSdWildcardSlot(n) ? "Wild card" : `Area ${n}`;
}
