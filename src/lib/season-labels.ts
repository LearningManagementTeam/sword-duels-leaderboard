import type { SeasonSlug } from "@/lib/scoring-config";

/** Public phase names — August is branded as The Nationals. */
export const PHASE_DISPLAY = {
  june: { label: "June", subtitle: "Area-wide" },
  july: { label: "July", subtitle: "Regional" },
  august: {
    label: "The Nationals",
    subtitle: "One-day event · 3 rounds",
  },
} as const;

export type PhaseSlug = keyof typeof PHASE_DISPLAY;

export function phaseLabel(phase: PhaseSlug): string {
  return PHASE_DISPLAY[phase].label;
}

export function phaseSubtitle(phase: PhaseSlug): string {
  return PHASE_DISPLAY[phase].subtitle;
}

export function seasonPhaseLabel(seasonSlug: SeasonSlug): string {
  if (seasonSlug === "june_area") return PHASE_DISPLAY.june.label;
  if (seasonSlug === "july_region") return PHASE_DISPLAY.july.label;
  return PHASE_DISPLAY.august.label;
}

export const SEASON_JOURNEY_LINE =
  "June → July → The Nationals — every round brings branches closer to glory";

export const NATIONALS_DESCRIPTION =
  "The Nationals is a one-day championship in August — three rounds, one crown.";
