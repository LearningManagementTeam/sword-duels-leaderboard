import type {
  KnockoutMatch,
  NationalsKnockoutModel,
} from "./nationals-knockout-bracket";
import type { NationalsEntrant } from "./nationals-entrant";
import type { SdKnockoutMatch, SdKnockoutMatchScore } from "./types";

function entrantFromBranch(
  branchId: string | null,
  byId: Map<string, NationalsEntrant>
): NationalsEntrant | null {
  if (!branchId) return null;
  return byId.get(branchId) ?? null;
}

/** Overlay DB match state onto the seeded bracket model. */
export function mergeKnockoutDbState(
  base: NationalsKnockoutModel,
  dbMatches: SdKnockoutMatch[],
  scoresByMatchId: Map<string, SdKnockoutMatchScore[]>,
  entrantByBranchId: Map<string, NationalsEntrant>,
  options: { publicView?: boolean } = {}
): NationalsKnockoutModel {
  const { publicView = false } = options;
  const dbByKey = new Map(
    dbMatches.map((m) => [`${m.round}:${m.match_index}`, m])
  );

  const rounds = base.rounds.map((roundMatches) =>
    roundMatches.map((uiMatch) => {
      const db = dbByKey.get(`${uiMatch.round}:${uiMatch.matchIndex}`);
      if (!db) return uiMatch;

      const entrantA =
        entrantFromBranch(db.entrant_a_branch_id, entrantByBranchId) ??
        uiMatch.entrantA;
      const entrantB =
        entrantFromBranch(db.entrant_b_branch_id, entrantByBranchId) ??
        uiMatch.entrantB;

      const winnerId =
        db.status === "published" || !publicView
          ? db.winner_branch_id
          : null;

      return {
        ...uiMatch,
        id: db.id,
        entrantA,
        entrantB,
        winnerId,
      } satisfies KnockoutMatch;
    })
  );

  let champion: NationalsEntrant | null = null;
  const finalRound = rounds[rounds.length - 1];
  const finalMatch = finalRound?.[0];
  if (finalMatch?.winnerId) {
    champion =
      entrantFromBranch(finalMatch.winnerId, entrantByBranchId) ??
      finalMatch.entrantA?.id === finalMatch.winnerId
        ? finalMatch.entrantA
        : finalMatch.entrantB;
  }

  return {
    ...base,
    rounds,
    champion,
  };
}

export function scoresMapForMatch(
  matchId: string,
  scoresByMatchId: Map<string, SdKnockoutMatchScore[]>
): Record<string, number> {
  const rows = scoresByMatchId.get(matchId) ?? [];
  const out: Record<string, number> = {};
  for (const row of rows) {
    out[row.branch_id] = row.points;
  }
  return out;
}
