import {
  DEMO_AREA_REPS,
  DEMO_FINAL_LOSERS,
  type NationalsAreaRep,
  type NationalsFinalLoser,
  type WildcardPreviewState,
} from "./nationals-wildcard-demo";
import {
  pickWildcardRoundWinner,
  resolveWildcardFromLosers,
  type WildcardLoser,
  type WildcardResolution,
} from "./wildcard-selection";

export interface NationalsWildcardModel {
  areaReps: NationalsAreaRep[];
  losers: NationalsFinalLoser[];
  resolution: WildcardResolution;
  phase: "locked_reps" | "auto_wildcard" | "tiebreak_pending" | "tiebreak_resolved";
  wildcardRep: WildcardLoser | null;
  tiebreakCandidates: WildcardLoser[];
  tiedScore: number | null;
  allSixteenLocked: boolean;
}

export function buildNationalsWildcardModel(
  preview: WildcardPreviewState
): NationalsWildcardModel {
  const resolution = resolveWildcardFromLosers(DEMO_FINAL_LOSERS);

  let tiebreakCandidates: WildcardLoser[] = [];
  let tiedScore: number | null = null;
  let wildcardRep: WildcardLoser | null = null;
  let phase: NationalsWildcardModel["phase"] = "locked_reps";

  if (resolution.kind === "auto" && !preview.forceTiebreak) {
    wildcardRep = resolution.candidate;
    phase = "auto_wildcard";
  } else if (resolution.kind === "tiebreak" || preview.forceTiebreak) {
    tiebreakCandidates =
      resolution.kind === "tiebreak"
        ? resolution.candidates
        : DEMO_FINAL_LOSERS.filter((l) => l.areaFinalScore === 6);
    tiedScore =
      resolution.kind === "tiebreak" ? resolution.tiedScore : 6;

    if (preview.confirmedWildcardId) {
      wildcardRep =
        tiebreakCandidates.find((c) => c.id === preview.confirmedWildcardId) ??
        pickWildcardRoundWinner(tiebreakCandidates, preview.wildcardScores);
      phase = wildcardRep ? "tiebreak_resolved" : "tiebreak_pending";
    } else {
      const draftWinner = pickWildcardRoundWinner(
        tiebreakCandidates,
        preview.wildcardScores
      );
      if (draftWinner && Object.keys(preview.wildcardScores).length > 0) {
        phase = "tiebreak_pending";
      } else {
        phase = "tiebreak_pending";
      }
      wildcardRep = null;
    }
  } else if (resolution.kind === "auto" && preview.forceTiebreak) {
    tiebreakCandidates = [resolution.candidate];
    tiedScore = resolution.candidate.areaFinalScore;
    phase = "tiebreak_pending";
  }

  if (preview.confirmedWildcardId && tiebreakCandidates.length > 0) {
    wildcardRep =
      tiebreakCandidates.find((c) => c.id === preview.confirmedWildcardId) ??
      wildcardRep;
    if (wildcardRep) phase = "tiebreak_resolved";
  }

  const allSixteenLocked =
    DEMO_AREA_REPS.length === 15 &&
    (phase === "auto_wildcard" || phase === "tiebreak_resolved") &&
    wildcardRep != null;

  return {
    areaReps: DEMO_AREA_REPS,
    losers: DEMO_FINAL_LOSERS,
    resolution,
    phase,
    wildcardRep,
    tiebreakCandidates,
    tiedScore,
    allSixteenLocked,
  };
}
