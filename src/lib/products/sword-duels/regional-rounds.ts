import type { Region } from "@/lib/scoring-config";
import { REGIONS } from "@/lib/scoring-config";
import type { NationalsAreaRep } from "./nationals-wildcard-data";
import type { SdSet } from "./types";

export const SD_REGIONAL_SET_ORDER = [
  "regional_r1",
  "regional_r2",
  "regional_r3",
] as const;

export type SdRegionalSetType = (typeof SD_REGIONAL_SET_ORDER)[number];

export function isRegionalSetType(
  setType: string
): setType is SdRegionalSetType {
  return (SD_REGIONAL_SET_ORDER as readonly string[]).includes(setType);
}

export const SD_REGIONAL_SET_LABELS: Record<SdRegionalSetType, string> = {
  regional_r1: "Regional Round 1",
  regional_r2: "Regional Round 2",
  regional_r3: "Regional Round 3",
};

export const SD_REGIONAL_ROUND_DAY_HINTS: Record<SdRegionalSetType, string> = {
  regional_r1: "Day 1",
  regional_r2: "Day 2",
  regional_r3: "Day 3",
};

/** Regional sets store the region slug in sd_sets.area (luzon | ncr | vismin). */
export function isRegionalAreaKey(area: string): area is Region {
  return (REGIONS as readonly string[]).includes(area);
}

export function countRegionalRoundsPublished(sets: SdSet[]): {
  published: number;
  total: number;
} {
  const regional = sets.filter((s) => isRegionalSetType(s.set_type));
  return {
    published: regional.filter((s) => s.status === "published").length,
    total: regional.length > 0 ? regional.length : REGIONS.length * 3,
  };
}

export function regionalAreaReps(
  areaReps: NationalsAreaRep[],
  region: Region
): NationalsAreaRep[] {
  return areaReps
    .filter((rep) => rep.region === region)
    .sort((a, b) =>
      a.area.localeCompare(b.area, undefined, { numeric: true })
    );
}

export async function ensureRegionalSetsForEvent(
  service: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createServiceClient>
  >,
  eventId: string
): Promise<void> {
  for (const region of REGIONS) {
    for (const setType of SD_REGIONAL_SET_ORDER) {
      const { data: existing } = await service
        .from("sd_sets")
        .select("id")
        .eq("event_id", eventId)
        .eq("area", region)
        .eq("set_type", setType)
        .maybeSingle();

      if (!existing) {
        await service.from("sd_sets").insert({
          event_id: eventId,
          area: region,
          set_type: setType,
          scoring_mode: "high_score",
          status: "draft",
        });
      }
    }
  }
}
