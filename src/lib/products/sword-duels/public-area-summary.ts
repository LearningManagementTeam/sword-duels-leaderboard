import { SD_BRACKET_COPY } from "@/lib/products/sword-duels/bracket-copy";
import type { SdSet } from "@/lib/products/sword-duels/types";

export type SdPublicAreaPhase =
  | "awaiting_groups"
  | "spot1_secured"
  | "spot2_secured"
  | "final_live"
  | "area_champion";

export interface SdPublicAreaSummary {
  phase: SdPublicAreaPhase;
  label: string;
  championName: string | null;
}

export function getSdPublicAreaSummary(
  areaSets: SdSet[],
  championName: string | null
): SdPublicAreaSummary {
  const ga = areaSets.find((s) => s.set_type === "group_a");
  const gb = areaSets.find((s) => s.set_type === "group_b");
  const fin = areaSets.find((s) => s.set_type === "area_final");

  if (fin?.status === "published" && championName) {
    return {
      phase: "area_champion",
      label: SD_BRACKET_COPY.areaChampion,
      championName,
    };
  }

  if (ga?.status === "published" && gb?.status === "published") {
    return {
      phase: "final_live",
      label: SD_BRACKET_COPY.areaFinalLive,
      championName: null,
    };
  }

  if (ga?.status === "published") {
    return {
      phase: "spot1_secured",
      label: "Spot 1 secured",
      championName: null,
    };
  }

  if (gb?.status === "published") {
    return {
      phase: "spot2_secured",
      label: "Spot 2 secured",
      championName: null,
    };
  }

  return {
    phase: "awaiting_groups",
    label: "In progress",
    championName: null,
  };
}
