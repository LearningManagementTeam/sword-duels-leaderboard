/** Competitions that read branch rep slots (Rep 1 / Rep 2 on branches). */

export type CompetitionRepProgramId = "sword_duels";

export interface CompetitionRepProgram {
  id: CompetitionRepProgramId;
  label: string;
  description: string;
}

export const COMPETITION_REP_PROGRAMS: CompetitionRepProgram[] = [
  {
    id: "sword_duels",
    label: "Sword Duels",
    description: "Area branch rep tournaments and public leaderboards",
  },
];

export function competitionRepProgramLabel(id: CompetitionRepProgramId): string {
  return COMPETITION_REP_PROGRAMS.find((p) => p.id === id)?.label ?? id;
}
