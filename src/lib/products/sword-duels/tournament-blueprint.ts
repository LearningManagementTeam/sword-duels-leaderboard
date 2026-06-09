import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import {
  SD_NATIONALS_PHASES_V1,
  SD_NATIONALS_PHASES_V2,
  SD_SET_FLOW,
} from "@/lib/products/sword-duels/scoring-config";
import type { TournamentBlueprintModel } from "@/lib/tournament-blueprint";
import {
  isRegionalAverageFormat,
  SD_TOURNAMENT_FORMAT_SUMMARY,
  type SdTournamentFormat,
} from "./tournament-format";

/** Static Sword Duels roadmap — areas through nationals (format-aware). */
export function buildSwordDuelsBlueprint(
  format: SdTournamentFormat | string | null | undefined = "classic_v1"
): TournamentBlueprintModel {
  const isV2 = isRegionalAverageFormat(format);
  const nationalsPhases = isV2 ? SD_NATIONALS_PHASES_V2 : SD_NATIONALS_PHASES_V1;

  const areaSteps = SD_SET_FLOW.map((set) => ({
    id: set.key,
    title: set.title,
    subtitle: set.spotLabel,
    detail: set.description,
    href: SWORD_DUELS_PUBLIC,
  }));

  const nationalsSteps = nationalsPhases.map((phase) => {
    let subtitle = "15 area reps";
    let href = `${SWORD_DUELS_PUBLIC}/nationals`;

    if (phase.key === "wildcard") subtitle = "Slot 16";
    if (phase.key === "knockout") subtitle = "Single elimination";
    if (phase.key === "regionals") subtitle = "Luzon · NCR · VisMin";
    if (phase.key === "finals") subtitle = "Semifinal + final";
    if (phase.key === "area_finals") href = SWORD_DUELS_PUBLIC;
    if (phase.key === "regionals") href = `${SWORD_DUELS_PUBLIC}/nationals#regionals`;
    if (phase.key === "finals" || phase.key === "knockout") {
      href = `${SWORD_DUELS_PUBLIC}/nationals#knockout`;
    }
    if (phase.key === "wildcard") {
      href = `${SWORD_DUELS_PUBLIC}/nationals#wildcard`;
    }

    return {
      id: phase.key,
      title: phase.title,
      subtitle,
      detail: phase.description,
      href,
    };
  });

  return {
    program: "sword_duels",
    headline: isV2
      ? "Sword Duels — Version 2 map"
      : "Sword Duels — full tournament map",
    tagline: isV2
      ? SD_TOURNAMENT_FORMAT_SUMMARY.regional_average_v2
      : SD_TOURNAMENT_FORMAT_SUMMARY.classic_v1,
    phases: [
      {
        id: "sd_areas",
        label: "Area battles",
        subtitle: "15 areas · 2 spots · 1 rep",
        steps: areaSteps,
      },
      {
        id: "sd_nationals",
        label: isV2 ? "Regionals & finals" : "The Nationals",
        subtitle: isV2
          ? "3-round regional average → finals"
          : "Wild card + knockout bracket",
        steps: nationalsSteps.slice(1),
      },
    ],
  };
}
