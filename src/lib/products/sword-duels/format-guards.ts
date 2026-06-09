import { createServiceClient } from "@/lib/supabase/server";
import {
  SD_REGIONAL_SET_ORDER,
  isRegionalSetType,
} from "@/lib/products/sword-duels/regional-rounds";

/** True when any area or regional set has been published — blocks format switch. */
export async function sdEventHasPublishedScores(eventId: string): Promise<boolean> {
  const service = await createServiceClient();
  const { count, error } = await service
    .from("sd_sets")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "published");

  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export function isAreaSetType(
  setType: string
): setType is "group_a" | "group_b" | "area_final" {
  return setType === "group_a" || setType === "group_b" || setType === "area_final";
}

export function regionalRoundIndex(
  setType: string
): 1 | 2 | 3 | null {
  if (setType === "regional_r1") return 1;
  if (setType === "regional_r2") return 2;
  if (setType === "regional_r3") return 3;
  return null;
}

export function priorRegionalSetType(
  setType: string
): (typeof SD_REGIONAL_SET_ORDER)[number] | null {
  const idx = SD_REGIONAL_SET_ORDER.indexOf(
    setType as (typeof SD_REGIONAL_SET_ORDER)[number]
  );
  if (idx <= 0) return null;
  return SD_REGIONAL_SET_ORDER[idx - 1]!;
}

export { isRegionalSetType };
