import { createServiceClient } from "@/lib/supabase/server";
import { loadNationalsRoster } from "./nationals-wildcard-data";
import type { SdWildcardRound, SdWildcardStatus } from "./types";
import {
  pickWildcardRoundWinner,
  resolveWildcardFromLosers,
} from "./wildcard-selection";

async function getOrCreateRound(eventId: string): Promise<SdWildcardRound> {
  const service = await createServiceClient();
  const { data: existing } = await service
    .from("sd_wildcard_rounds")
    .select("id, event_id, status, tied_score, winner_branch_id, published_at")
    .eq("event_id", eventId)
    .maybeSingle();

  if (existing) {
    return {
      id: existing.id,
      event_id: existing.event_id,
      status: existing.status as SdWildcardStatus,
      tied_score: existing.tied_score != null ? Number(existing.tied_score) : null,
      winner_branch_id: existing.winner_branch_id,
      published_at: existing.published_at,
    };
  }

  const { data: created, error } = await service
    .from("sd_wildcard_rounds")
    .insert({ event_id: eventId, status: "pending" })
    .select("id, event_id, status, tied_score, winner_branch_id, published_at")
    .single();

  if (error || !created) throw new Error(error?.message ?? "Failed to create wildcard round");

  return {
    id: created.id,
    event_id: created.event_id,
    status: created.status as SdWildcardStatus,
    tied_score: null,
    winner_branch_id: null,
    published_at: null,
  };
}

/** Recompute wildcard state after area finals change. */
export async function syncWildcardRound(eventId: string): Promise<void> {
  const service = await createServiceClient();
  const roster = await loadNationalsRoster(eventId);
  const round = await getOrCreateRound(eventId);
  const now = new Date().toISOString();

  if (!roster.allAreaFinalsPublished) {
    await service
      .from("sd_wildcard_rounds")
      .update({
        status: "pending",
        tied_score: null,
        winner_branch_id: null,
        published_at: null,
        updated_at: now,
      })
      .eq("id", round.id);
    await service.from("sd_wildcard_scores").delete().eq("wildcard_round_id", round.id);
    return;
  }

  const resolution = resolveWildcardFromLosers(roster.losers);

  if (resolution.kind === "insufficient") {
    await service
      .from("sd_wildcard_rounds")
      .update({
        status: "pending",
        tied_score: null,
        winner_branch_id: null,
        published_at: null,
        updated_at: now,
      })
      .eq("id", round.id);
    return;
  }

  if (resolution.kind === "auto") {
    await service
      .from("sd_wildcard_rounds")
      .update({
        status: "auto_resolved",
        tied_score: resolution.candidate.areaFinalScore,
        winner_branch_id: resolution.candidate.id,
        published_at: now,
        updated_at: now,
      })
      .eq("id", round.id);
    await service.from("sd_wildcard_scores").delete().eq("wildcard_round_id", round.id);
    return;
  }

  // Tiebreak — preserve draft scores when candidates unchanged
  if (round.status === "tiebreak_published") {
    return;
  }

  const { data: existingScores } = await service
    .from("sd_wildcard_scores")
    .select("branch_id, points")
    .eq("wildcard_round_id", round.id);

  const pointsByBranch = new Map(
    (existingScores ?? []).map((s) => [s.branch_id, Number(s.points)])
  );

  await service
    .from("sd_wildcard_rounds")
    .update({
      status: "tiebreak_draft",
      tied_score: resolution.tiedScore,
      winner_branch_id: null,
      published_at: null,
      updated_at: now,
    })
    .eq("id", round.id);

  await service.from("sd_wildcard_scores").delete().eq("wildcard_round_id", round.id);

  if (resolution.candidates.length > 0) {
    const { error } = await service.from("sd_wildcard_scores").insert(
      resolution.candidates.map((c) => ({
        wildcard_round_id: round.id,
        branch_id: c.id,
        area: c.area,
        area_final_score: c.areaFinalScore,
        points: pointsByBranch.get(c.id) ?? 0,
        updated_at: now,
      }))
    );
    if (error) throw new Error(error.message);
  }
}

export async function publishWildcardRound(eventId: string): Promise<void> {
  const service = await createServiceClient();
  const roster = await loadNationalsRoster(eventId);
  const resolution = resolveWildcardFromLosers(roster.losers);

  const { data: round } = await service
    .from("sd_wildcard_rounds")
    .select("id, status")
    .eq("event_id", eventId)
    .single();

  if (!round) throw new Error("Wildcard round not initialized");
  if (round.status !== "tiebreak_draft") {
    throw new Error("Wildcard round is not in tiebreak draft state");
  }
  if (resolution.kind !== "tiebreak") {
    throw new Error("No tiebreak candidates to publish");
  }

  const { data: scoreRows } = await service
    .from("sd_wildcard_scores")
    .select("branch_id, area, area_final_score, points")
    .eq("wildcard_round_id", round.id);

  const scores: Record<string, number> = {};
  for (const row of scoreRows ?? []) {
    scores[row.branch_id] = Number(row.points);
  }

  const winner = pickWildcardRoundWinner(resolution.candidates, scores);
  if (!winner) {
    throw new Error("Enter wildcard-round scores for all tied candidates before publishing");
  }

  const now = new Date().toISOString();
  const { error } = await service
    .from("sd_wildcard_rounds")
    .update({
      status: "tiebreak_published",
      winner_branch_id: winner.id,
      published_at: now,
      updated_at: now,
    })
    .eq("id", round.id);

  if (error) throw new Error(error.message);
}

export async function unpublishWildcardRound(eventId: string): Promise<void> {
  const service = await createServiceClient();
  const now = new Date().toISOString();

  const { data: round } = await service
    .from("sd_wildcard_rounds")
    .select("id, status")
    .eq("event_id", eventId)
    .maybeSingle();

  if (!round || round.status !== "tiebreak_published") {
    throw new Error("Wildcard round is not published");
  }

  const { error } = await service
    .from("sd_wildcard_rounds")
    .update({
      status: "tiebreak_draft",
      winner_branch_id: null,
      published_at: null,
      updated_at: now,
    })
    .eq("id", round.id);

  if (error) throw new Error(error.message);
}
