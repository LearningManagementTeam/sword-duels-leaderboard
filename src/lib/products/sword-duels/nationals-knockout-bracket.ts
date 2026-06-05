import {
  buildPlaceholderNationalsEntrants,
  type NationalsEntrant,
} from "./nationals-entrant";

export type KnockoutRoundKey = "r16" | "qf" | "sf" | "final";

export const KNOCKOUT_ROUND_LABELS: Record<KnockoutRoundKey, string> = {
  r16: "Round of 16",
  qf: "Quarterfinals",
  sf: "Semifinals",
  final: "Final",
};

export interface KnockoutMatch {
  id: string;
  round: KnockoutRoundKey;
  roundIndex: number;
  matchIndex: number;
  label: string;
  entrantA: NationalsEntrant | null;
  entrantB: NationalsEntrant | null;
  winnerId: string | null;
}

export interface NationalsKnockoutModel {
  entrants: NationalsEntrant[];
  rounds: KnockoutMatch[][];
  champion: NationalsEntrant | null;
  fieldSize: number;
}

const ROUND_KEYS: KnockoutRoundKey[] = ["r16", "qf", "sf", "final"];

function pairLabel(a: NationalsEntrant | null, b: NationalsEntrant | null): string {
  const left = a?.slotLabel ?? "TBD";
  const right = b?.slotLabel ?? "TBD";
  return `${left} vs ${right}`;
}

/** Seed bracket: (Area 1 vs 2), (3 vs 4), … (15 vs Wild card). */
export function buildNationalsKnockoutBracket(
  entrants: NationalsEntrant[]
): NationalsKnockoutModel {
  const fieldSize = entrants.length;
  if (fieldSize < 2) {
    return { entrants, rounds: [], champion: null, fieldSize };
  }

  const r16Matches: KnockoutMatch[] = [];
  for (let i = 0; i < entrants.length; i += 2) {
    const entrantA = entrants[i] ?? null;
    const entrantB = entrants[i + 1] ?? null;
    r16Matches.push({
      id: `r16-${i / 2}`,
      round: "r16",
      roundIndex: 0,
      matchIndex: i / 2,
      label: pairLabel(entrantA, entrantB),
      entrantA,
      entrantB,
      winnerId: null,
    });
  }

  const rounds: KnockoutMatch[][] = [r16Matches];
  let prevCount = r16Matches.length;

  for (let r = 1; r < ROUND_KEYS.length && prevCount > 1; r++) {
    const roundKey = ROUND_KEYS[r]!;
    const matchCount = Math.floor(prevCount / 2);
    const roundMatches: KnockoutMatch[] = [];

    for (let m = 0; m < matchCount; m++) {
      roundMatches.push({
        id: `${roundKey}-${m}`,
        round: roundKey,
        roundIndex: r,
        matchIndex: m,
        label: "Awaiting winners",
        entrantA: null,
        entrantB: null,
        winnerId: null,
      });
    }

    rounds.push(roundMatches);
    prevCount = matchCount;
  }

  return {
    entrants,
    rounds,
    champion: null,
    fieldSize,
  };
}

export function buildPlaceholderKnockoutModel(): NationalsKnockoutModel {
  return buildNationalsKnockoutBracket(buildPlaceholderNationalsEntrants());
}
