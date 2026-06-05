import { SD_BRACKET_COPY } from "@/lib/products/sword-duels/bracket-copy";
import type { SdDashboardArea } from "@/lib/products/sword-duels/queries";

export type SdAreaStatusPhase =
  | "awaiting_groups"
  | "spot1_secured"
  | "spot2_secured"
  | "final_live"
  | "area_champion";

export interface SdAreaStatus {
  phase: SdAreaStatusPhase;
  label: string;
  detail?: string;
}

/** Derive a single readable status for admin area cards. */
export function getSdAreaStatus(area: SdDashboardArea): SdAreaStatus {
  if (area.finalPublished && area.areaChampionName) {
    return {
      phase: "area_champion",
      label: SD_BRACKET_COPY.areaChampion,
      detail: area.areaChampionName,
    };
  }

  if (area.groupAPublished && area.groupBPublished) {
    return {
      phase: "final_live",
      label: SD_BRACKET_COPY.areaFinalLive,
      detail: "Publish area final when scores are in",
    };
  }

  if (area.groupAPublished) {
    return {
      phase: "spot1_secured",
      label: "Spot 1 secured",
      detail: "Awaiting Group B battle",
    };
  }

  if (area.groupBPublished) {
    return {
      phase: "spot2_secured",
      label: "Spot 2 secured",
      detail: "Awaiting Group A battle",
    };
  }

  return {
    phase: "awaiting_groups",
    label: "Awaiting group battles",
    detail: "Score and publish Group A & B",
  };
}
