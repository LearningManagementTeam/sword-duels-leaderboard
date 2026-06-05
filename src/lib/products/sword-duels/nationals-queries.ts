import { createServiceClient } from "@/lib/supabase/server";
import { buildKnockoutFromNationalsModel, buildKnockoutEntrantsFromModel } from "./build-nationals-knockout";
import { buildNationalsWildcardModel } from "./build-nationals-wildcard-model";
import { loadKnockoutBracketState } from "./knockout-sync";
import { mergeKnockoutDbState } from "./merge-knockout-model";
import { loadNationalsRoster } from "./nationals-wildcard-data";
import type { NationalsKnockoutModel } from "./nationals-knockout-bracket";
import type { SdKnockoutBracket, SdKnockoutMatch } from "./types";
import type { SdWildcardRound, SdWildcardScore, SdWildcardStatus } from "./types";

export interface SdNationalsContext {
  roster: Awaited<ReturnType<typeof loadNationalsRoster>>;
  wildcardRound: SdWildcardRound | null;
  wildcardScores: SdWildcardScore[];
  model: ReturnType<typeof buildNationalsWildcardModel>;
  knockoutBracket: SdKnockoutBracket | null;
  knockoutMatches: SdKnockoutMatch[];
  knockoutModel: NationalsKnockoutModel | null;
}

async function loadWildcardRound(
  eventId: string
): Promise<SdWildcardRound | null> {
  const service = await createServiceClient();
  const { data, error } = await service
    .from("sd_wildcard_rounds")
    .select("id, event_id, status, tied_score, winner_branch_id, published_at")
    .eq("event_id", eventId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    event_id: data.event_id,
    status: data.status as SdWildcardStatus,
    tied_score: data.tied_score != null ? Number(data.tied_score) : null,
    winner_branch_id: data.winner_branch_id,
    published_at: data.published_at,
  };
}

async function loadWildcardScores(
  roundId: string | null
): Promise<SdWildcardScore[]> {
  if (!roundId) return [];
  const service = await createServiceClient();
  const { data } = await service
    .from("sd_wildcard_scores")
    .select("branch_id, area, area_final_score, points")
    .eq("wildcard_round_id", roundId)
    .order("area");

  return (data ?? []).map((row) => ({
    branch_id: row.branch_id,
    area: row.area,
    area_final_score: Number(row.area_final_score),
    points: Number(row.points),
  }));
}

export async function getSdNationalsContext(
  eventId: string
): Promise<SdNationalsContext> {
  const roster = await loadNationalsRoster(eventId);
  const wildcardRound = await loadWildcardRound(eventId);
  const wildcardScores = await loadWildcardScores(wildcardRound?.id ?? null);
  const model = buildNationalsWildcardModel({
    roster,
    wildcardRound,
    wildcardScores,
  });

  let knockoutBracket: SdKnockoutBracket | null = null;
  let knockoutMatches: SdKnockoutMatch[] = [];
  let knockoutModel: NationalsKnockoutModel | null = null;

  try {
    const ko = await loadKnockoutBracketState(eventId);
    knockoutBracket = ko.bracket;
    knockoutMatches = ko.matches;

    if (model.allFieldLocked && ko.bracket && ko.bracket.status !== "pending") {
      const base = buildKnockoutFromNationalsModel(model);
      const entrantByBranchId = new Map(
        buildKnockoutEntrantsFromModel(model).map((e) => [e.id, e])
      );
      knockoutModel = mergeKnockoutDbState(
        base,
        ko.matches,
        ko.scoresByMatchId,
        entrantByBranchId,
        { publicView: false }
      );
    }
  } catch {
    /* knockout tables may not exist until migration 020 */
  }

  return {
    roster,
    wildcardRound,
    wildcardScores,
    model,
    knockoutBracket,
    knockoutMatches,
    knockoutModel,
  };
}

export async function getSdPublicKnockoutModel(
  eventId: string,
  context: SdNationalsContext,
  publicView = true
): Promise<NationalsKnockoutModel | null> {
  if (!context.model.allFieldLocked) return null;
  if (!context.knockoutBracket || context.knockoutBracket.status === "pending") {
    return null;
  }

  try {
    const ko = await loadKnockoutBracketState(eventId);
    const base = buildKnockoutFromNationalsModel(context.model);
    const entrantByBranchId = new Map(
      buildKnockoutEntrantsFromModel(context.model).map((e) => [e.id, e])
    );
    return mergeKnockoutDbState(
      base,
      ko.matches,
      ko.scoresByMatchId,
      entrantByBranchId,
      { publicView }
    );
  } catch {
    return null;
  }
}
