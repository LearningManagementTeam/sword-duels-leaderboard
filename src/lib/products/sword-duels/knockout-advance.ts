import type { KnockoutRoundKey } from "./nationals-knockout-bracket";

const NEXT_ROUND: Partial<Record<KnockoutRoundKey, KnockoutRoundKey>> = {
  r16: "qf",
  qf: "sf",
  sf: "final",
};

export function nextRoundKey(round: KnockoutRoundKey): KnockoutRoundKey | null {
  return NEXT_ROUND[round] ?? null;
}

/** Where the winner of (round, matchIndex) advances. */
export function advancementSlot(
  round: KnockoutRoundKey,
  matchIndex: number
): { round: KnockoutRoundKey; matchIndex: number; side: "a" | "b" } | null {
  const next = nextRoundKey(round);
  if (!next) return null;
  return {
    round: next,
    matchIndex: Math.floor(matchIndex / 2),
    side: matchIndex % 2 === 0 ? "a" : "b",
  };
}

export function pickKnockoutMatchWinner(
  entrantAId: string,
  entrantBId: string,
  scores: Record<string, number>
): string {
  const a = scores[entrantAId] ?? 0;
  const b = scores[entrantBId] ?? 0;
  if (a === b) {
    throw new Error("Scores cannot tie — enter a decisive winner before publishing");
  }
  return a > b ? entrantAId : entrantBId;
}

export const KNOCKOUT_ROUND_ORDER: KnockoutRoundKey[] = ["r16", "qf", "sf", "final"];

/** Match counts per round for a 16-entrant field. */
export function knockoutMatchCounts(fieldSize: number): number[] {
  const counts: number[] = [];
  let n = Math.floor(fieldSize / 2);
  while (n >= 1) {
    counts.push(n);
    n = Math.floor(n / 2);
  }
  return counts;
}
