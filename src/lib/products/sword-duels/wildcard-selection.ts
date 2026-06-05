export interface WildcardLoser {
  id: string;
  area: string;
  repName: string;
  areaFinalScore: number;
}

export type WildcardResolution =
  | { kind: "auto"; candidate: WildcardLoser }
  | { kind: "tiebreak"; candidates: WildcardLoser[]; tiedScore: number }
  | { kind: "insufficient"; reason: string };

/** Pick wildcard from area-final losers: 2nd-highest score tier; ties → tiebreak. */
export function resolveWildcardFromLosers(
  losers: WildcardLoser[]
): WildcardResolution {
  if (losers.length === 0) {
    return { kind: "insufficient", reason: "No area-final losers to evaluate." };
  }

  const distinctScores = [
    ...new Set(losers.map((l) => l.areaFinalScore)),
  ].sort((a, b) => b - a);

  if (distinctScores.length < 2) {
    return {
      kind: "insufficient",
      reason: "Need at least two distinct loser scores for wildcard selection.",
    };
  }

  const tiedScore = distinctScores[1];
  const candidates = losers
    .filter((l) => l.areaFinalScore === tiedScore)
    .sort((a, b) => a.area.localeCompare(b.area, undefined, { numeric: true }));

  if (candidates.length === 1) {
    return { kind: "auto", candidate: candidates[0]! };
  }

  return { kind: "tiebreak", candidates, tiedScore };
}

export function pickWildcardRoundWinner(
  candidates: WildcardLoser[],
  scores: Record<string, number>
): WildcardLoser | null {
  if (candidates.length === 0) return null;

  let best: WildcardLoser | null = null;
  let bestScore = -Infinity;

  for (const c of candidates) {
    const score = scores[c.id];
    if (score == null || Number.isNaN(score)) continue;
    if (score > bestScore) {
      bestScore = score;
      best = c;
    } else if (score === bestScore && best) {
      if (c.area.localeCompare(best.area, undefined, { numeric: true }) < 0) {
        best = c;
      }
    }
  }

  return best;
}
