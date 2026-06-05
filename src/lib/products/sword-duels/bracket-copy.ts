/** Shared gamified copy for Sword Duels bracket UI — easy on the eyes, distinct from Area Champion. */
export const SD_BRACKET_COPY = {
  spotSecured: "Spot secured",
  spotPending: "Awaiting survivor",
  spotAdvances: "Advances to area final",
  areaFinal: "Area final",
  areaFinalLive: "Final clash live",
  areaFinalPending: "Scores incoming",
  areaChampion: "Area champion",
  areaRep: (area: string) => `${area} representative`,
  battleLive: "Battle live",
  finalLocked: "Final locked",
  finalLockedHint: "Publish both group battles to unlock Spot 1 vs Spot 2",
  duelLocked: "Duel locked",
} as const;

export function spotLabel(spot: 1 | 2): string {
  return spot === 1 ? "Spot 1" : "Spot 2";
}

export function spotPlaceholder(spot: 1 | 2): string {
  return spot === 1 ? "Group A survivor" : "Group B survivor";
}
