import type {
  NationalsAreaRep,
  NationalsFinalLoser,
  NationalsRoster,
} from "./nationals-wildcard-data";
import type { SdWildcardRound, SdWildcardScore } from "./types";
import {
  pickWildcardRoundWinner,
  resolveWildcardFromLosers,
  type WildcardLoser,
  type WildcardResolution,
} from "./wildcard-selection";

export type NationalsWildcardPhase =
  | "awaiting_areas"
  | "insufficient"
  | "auto_wildcard"
  | "tiebreak_pending"
  | "tiebreak_resolved";

export interface NationalsWildcardModel {
  roster: NationalsRoster;
  areaReps: NationalsAreaRep[];
  losers: NationalsFinalLoser[];
  resolution: WildcardResolution;
  phase: NationalsWildcardPhase;
  wildcardRep: WildcardLoser | null;
  tiebreakCandidates: WildcardLoser[];
  tiedScore: number | null;
  wildcardRound: SdWildcardRound | null;
  wildcardScores: SdWildcardScore[];
  targetFieldSize: number;
  lockedCount: number;
  allFieldLocked: boolean;
}

function loserFromBranchId(
  losers: NationalsFinalLoser[],
  branchId: string | null
): WildcardLoser | null {
  if (!branchId) return null;
  return losers.find((l) => l.id === branchId) ?? null;
}

export function buildNationalsWildcardModel(input: {
  roster: NationalsRoster;
  wildcardRound: SdWildcardRound | null;
  wildcardScores: SdWildcardScore[];
}): NationalsWildcardModel {
  const { roster, wildcardRound, wildcardScores } = input;
  const targetFieldSize = roster.totalAreaCount + 1;
  const lockedReps = roster.publishedAreaCount;

  if (!roster.allAreaFinalsPublished) {
    return {
      roster,
      areaReps: roster.areaReps,
      losers: roster.losers,
      resolution: { kind: "insufficient", reason: "Awaiting all area finals." },
      phase: "awaiting_areas",
      wildcardRep: null,
      tiebreakCandidates: [],
      tiedScore: null,
      wildcardRound,
      wildcardScores,
      targetFieldSize,
      lockedCount: lockedReps,
      allFieldLocked: false,
    };
  }

  const resolution = resolveWildcardFromLosers(roster.losers);
  let phase: NationalsWildcardPhase = "insufficient";
  let wildcardRep: WildcardLoser | null = null;
  let tiebreakCandidates: WildcardLoser[] = [];
  let tiedScore: number | null = null;

  if (resolution.kind === "insufficient") {
    phase = "insufficient";
  } else if (wildcardRound?.status === "auto_resolved") {
    phase = "auto_wildcard";
    wildcardRep = loserFromBranchId(roster.losers, wildcardRound.winner_branch_id);
    tiedScore = wildcardRound.tied_score;
  } else if (
    wildcardRound?.status === "tiebreak_published" &&
    wildcardRound.winner_branch_id
  ) {
    phase = "tiebreak_resolved";
    wildcardRep = loserFromBranchId(roster.losers, wildcardRound.winner_branch_id);
    tiedScore = wildcardRound.tied_score;
    tiebreakCandidates =
      resolution.kind === "tiebreak" ? resolution.candidates : [];
  } else if (
    wildcardRound?.status === "tiebreak_draft" &&
    resolution.kind === "tiebreak"
  ) {
    phase = "tiebreak_pending";
    tiebreakCandidates = resolution.candidates;
    tiedScore = resolution.tiedScore;
  } else if (resolution.kind === "auto") {
    phase = "auto_wildcard";
    wildcardRep = resolution.candidate;
  } else if (resolution.kind === "tiebreak") {
    phase = "tiebreak_pending";
    tiebreakCandidates = resolution.candidates;
    tiedScore = resolution.tiedScore;
  }

  const wildcardLocked =
    phase === "auto_wildcard" || phase === "tiebreak_resolved";

  return {
    roster,
    areaReps: roster.areaReps,
    losers: roster.losers,
    resolution,
    phase,
    wildcardRep,
    tiebreakCandidates,
    tiedScore,
    wildcardRound,
    wildcardScores,
    targetFieldSize,
    lockedCount: lockedReps + (wildcardLocked ? 1 : 0),
    allFieldLocked: wildcardLocked && lockedReps === roster.totalAreaCount,
  };
}

export function wildcardScoresMap(
  scores: SdWildcardScore[],
  candidates: WildcardLoser[],
  includeDraft: boolean
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const c of candidates) {
    const row = scores.find((s) => s.branch_id === c.id);
    if (row && (includeDraft || row.points > 0)) {
      map[c.id] = row.points;
    }
  }
  return map;
}

export function previewWildcardLeader(
  candidates: WildcardLoser[],
  scores: SdWildcardScore[]
): WildcardLoser | null {
  const scoreMap: Record<string, number> = {};
  for (const s of scores) {
    scoreMap[s.branch_id] = s.points;
  }
  return pickWildcardRoundWinner(candidates, scoreMap);
}
