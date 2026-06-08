import { wildcardScoresMap } from "./build-nationals-wildcard-model";
import {
  buildHybridKnockoutEntrants,
  buildKnockoutFromNationalsModel,
} from "./build-nationals-knockout";
import { entrantFromWildcard } from "./nationals-entrant";
import { buildNationalsKnockoutBracket } from "./nationals-knockout-bracket";
import type { NationalsKnockoutModel } from "./nationals-knockout-bracket";
import type { NationalsWildcardModel } from "./build-nationals-wildcard-model";
import { getSdNationalsContext, getSdPublicKnockoutModel } from "./nationals-queries";

export interface NationalsPublicView {
  model: NationalsWildcardModel;
  wildcardScores: Record<string, number>;
  confirmedWildcardId?: string;
  knockoutModel: NationalsKnockoutModel;
  knockoutIsLive: boolean;
  knockoutIsPreview: boolean;
}

export async function loadNationalsPublicView(
  eventId: string
): Promise<NationalsPublicView> {
  const context = await getSdNationalsContext(eventId);
  const { model } = context;

  const wildcardScores = wildcardScoresMap(
    context.wildcardScores,
    model.tiebreakCandidates,
    false
  );

  const wildcardEntrant =
    model.wildcardRep && model.allFieldLocked
      ? entrantFromWildcard({
          branchId: model.wildcardRep.id,
          area: model.wildcardRep.area,
          region:
            model.losers.find((l) => l.id === model.wildcardRep!.id)?.region ??
            "ncr",
          repName: model.wildcardRep.repName,
          branchName:
            model.losers.find((l) => l.id === model.wildcardRep!.id)
              ?.branchLabel ?? model.wildcardRep.area,
          branchCode:
            model.losers.find((l) => l.id === model.wildcardRep!.id)?.branchCode,
          employeeNo:
            model.losers.find((l) => l.id === model.wildcardRep!.id)?.employeeNo,
          position:
            model.losers.find((l) => l.id === model.wildcardRep!.id)?.position,
          photoUrl:
            model.wildcardRep.photoUrl ??
            model.losers.find((l) => l.id === model.wildcardRep!.id)?.photoUrl,
        })
      : null;

  const liveKnockout = await getSdPublicKnockoutModel(eventId, context, true);

  const placeholderKnockout = buildNationalsKnockoutBracket(
    buildHybridKnockoutEntrants(
      model.areaReps,
      model.roster.totalAreaCount,
      wildcardEntrant
    )
  );

  const knockoutModel =
    liveKnockout ??
    (model.allFieldLocked
      ? buildKnockoutFromNationalsModel(model)
      : placeholderKnockout);

  return {
    model,
    wildcardScores,
    confirmedWildcardId:
      model.wildcardRound?.status === "tiebreak_published"
        ? model.wildcardRound.winner_branch_id ?? undefined
        : undefined,
    knockoutModel,
    knockoutIsLive: !!liveKnockout,
    knockoutIsPreview: !liveKnockout,
  };
}
