import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import {
  SD_NATIONALS_PHASES,
  SD_SET_FLOW,
} from "@/lib/products/sword-duels/scoring-config";
import type { TournamentBlueprintModel } from "@/lib/tournament-blueprint";

/** Static Sword Duels roadmap — areas through nationals knockout. */
export function buildSwordDuelsBlueprint(): TournamentBlueprintModel {
  const areaSteps = SD_SET_FLOW.map((set) => ({
    id: set.key,
    title: set.title,
    subtitle: set.spotLabel,
    detail: set.description,
    href: SWORD_DUELS_PUBLIC,
  }));

  const nationalsSteps = SD_NATIONALS_PHASES.map((phase) => ({
    id: phase.key,
    title: phase.title,
    subtitle:
      phase.key === "wildcard"
        ? "Slot 16"
        : phase.key === "knockout"
          ? "Single elimination"
          : "15 area reps",
    detail: phase.description,
    href:
      phase.key === "area_finals"
        ? SWORD_DUELS_PUBLIC
        : `${SWORD_DUELS_PUBLIC}/nationals`,
  }));

  return {
    program: "sword_duels",
    headline: "Sword Duels — full tournament map",
    tagline:
      "Fifteen areas, two branch spots each, one representative — then wild card and knockout to a national champion.",
    phases: [
      {
        id: "sd_areas",
        label: "Area battles",
        subtitle: "15 areas · 2 spots · 1 rep",
        steps: areaSteps,
      },
      {
        id: "sd_nationals",
        label: "The Nationals",
        subtitle: "Wild card + knockout bracket",
        steps: nationalsSteps.slice(1),
      },
    ],
  };
}
