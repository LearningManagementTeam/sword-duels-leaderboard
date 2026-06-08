import type { Region } from "@/lib/scoring-config";
import { resolveActiveRepresentativeProfile } from "@/lib/representative-active";
import type { WildcardLoser } from "./wildcard-selection";
import {
  getSdAreaBrackets,
  getSdSetScores,
  getSdSetsForEvent,
  participantsForSetType,
  scoresBySetId,
} from "./queries";
import { computeSetResults } from "./scoring";
import type { SdAreaBracket, SdSet, SdSetScore } from "./types";

export interface NationalsAreaRep {
  area: string;
  region: Region;
  repName: string;
  branchName: string;
  branchCode: string;
  branchId: string;
  employeeNo: string | null;
  position: string | null;
  photoUrl?: string | null;
  finalScore: number;
}

export interface NationalsFinalLoser extends WildcardLoser {
  region: Region;
  branchLabel: string;
  branchCode: string;
  employeeNo: string | null;
  position: string | null;
}

export interface NationalsRoster {
  areaReps: NationalsAreaRep[];
  losers: NationalsFinalLoser[];
  totalAreaCount: number;
  publishedAreaCount: number;
  allAreaFinalsPublished: boolean;
}

export function buildNationalsRosterFromContext(
  brackets: SdAreaBracket[],
  sets: SdSet[],
  scoreMap: Map<string, SdSetScore[]>
): NationalsRoster {
  const areaReps: NationalsAreaRep[] = [];
  const losers: NationalsFinalLoser[] = [];

  for (const bracket of brackets) {
    const areaSets = sets.filter((s) => s.area === bracket.area);
    const finalSet = areaSets.find((s) => s.set_type === "area_final");
    if (finalSet?.status !== "published" || !finalSet.winner_branch_id) {
      continue;
    }

    const participants = participantsForSetType(bracket, "area_final", areaSets);
    const scores = scoreMap.get(finalSet.id) ?? [];
    const { ranked } = computeSetResults(
      participants,
      scores,
      finalSet.scoring_mode
    );

    const winnerRow = ranked.find((r) => r.branch_id === finalSet.winner_branch_id);
    const loserRow = ranked.find((r) => r.branch_id !== finalSet.winner_branch_id);
    const winnerBranch = participants.find((p) => p.branch_id === finalSet.winner_branch_id);
    const loserBranch = participants.find((p) => p.branch_id === loserRow?.branch_id);
    const winnerScore = scores.find((s) => s.branch_id === finalSet.winner_branch_id);
    const loserScore = loserRow
      ? scores.find((s) => s.branch_id === loserRow.branch_id)
      : undefined;

    if (winnerRow && winnerBranch) {
      const profile = resolveActiveRepresentativeProfile(
        winnerBranch,
        winnerScore?.active_representative,
        winnerScore
          ? {
              active_employee_id: winnerScore.active_employee_id,
              active_employee_name: winnerScore.active_employee_name,
              active_employee_no: winnerScore.active_employee_no,
              active_employee_position: winnerScore.active_employee_position,
              active_employee_status: winnerScore.active_employee_status,
              active_employee_photo_path: winnerScore.active_employee_photo_path,
            }
          : null
      );
      areaReps.push({
        area: bracket.area,
        region: bracket.region as Region,
        repName:
          winnerRow.active_representative_name?.trim() ||
          profile.name ||
          winnerRow.branch_name,
        branchName: winnerRow.branch_name,
        branchCode: winnerRow.branch_code,
        branchId: winnerRow.branch_id,
        employeeNo: profile.employeeNo,
        position: profile.position,
        photoUrl: profile.photoUrl,
        finalScore: winnerRow.points,
      });
    }

    if (loserRow && loserBranch) {
      const profile = resolveActiveRepresentativeProfile(
        loserBranch,
        loserScore?.active_representative,
        loserScore
          ? {
              active_employee_id: loserScore.active_employee_id,
              active_employee_name: loserScore.active_employee_name,
              active_employee_no: loserScore.active_employee_no,
              active_employee_position: loserScore.active_employee_position,
              active_employee_status: loserScore.active_employee_status,
              active_employee_photo_path: loserScore.active_employee_photo_path,
            }
          : null
      );
      losers.push({
        id: loserRow.branch_id,
        area: bracket.area,
        region: bracket.region as Region,
        repName:
          loserRow.active_representative_name?.trim() ||
          profile.name ||
          loserRow.branch_name,
        branchLabel: loserRow.branch_name,
        branchCode: loserRow.branch_code,
        employeeNo: profile.employeeNo,
        position: profile.position,
        photoUrl: profile.photoUrl,
        areaFinalScore: loserRow.points,
      });
    }
  }

  areaReps.sort((a, b) =>
    a.area.localeCompare(b.area, undefined, { numeric: true })
  );
  losers.sort((a, b) =>
    a.area.localeCompare(b.area, undefined, { numeric: true })
  );

  const publishedAreaCount = areaReps.length;
  const totalAreaCount = brackets.length;

  return {
    areaReps,
    losers,
    totalAreaCount,
    publishedAreaCount,
    allAreaFinalsPublished:
      totalAreaCount > 0 && publishedAreaCount === totalAreaCount,
  };
}

export async function loadNationalsRoster(eventId: string): Promise<NationalsRoster> {
  const [brackets, sets] = await Promise.all([
    getSdAreaBrackets(eventId),
    getSdSetsForEvent(eventId),
  ]);
  const setIds = sets.filter((s) => s.id).map((s) => s.id);
  const scoreRows = await getSdSetScores(setIds);
  const scoreMap = scoresBySetId(scoreRows);
  return buildNationalsRosterFromContext(brackets, sets, scoreMap);
}
