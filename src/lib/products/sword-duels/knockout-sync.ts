import { createServiceClient } from "@/lib/supabase/server";
import { buildKnockoutEntrantsFromModel } from "./build-nationals-knockout";
import type { NationalsWildcardModel } from "./build-nationals-wildcard-model";
import {
  advancementSlot,
  KNOCKOUT_ROUND_ORDER,
  knockoutMatchCounts,
  pickKnockoutMatchWinner,
} from "./knockout-advance";
import type { KnockoutRoundKey } from "./nationals-knockout-bracket";
import type {
  SdKnockoutBracket,
  SdKnockoutMatch,
  SdKnockoutMatchScore,
} from "./types";

async function getOrCreateBracket(eventId: string): Promise<SdKnockoutBracket> {
  const service = await createServiceClient();
  const { data: existing } = await service
    .from("sd_knockout_brackets")
    .select("id, event_id, status, champion_branch_id")
    .eq("event_id", eventId)
    .maybeSingle();

  if (existing) {
    return {
      id: existing.id,
      event_id: existing.event_id,
      status: existing.status as SdKnockoutBracket["status"],
      champion_branch_id: existing.champion_branch_id,
    };
  }

  const { data: created, error } = await service
    .from("sd_knockout_brackets")
    .insert({ event_id: eventId, status: "pending" })
    .select("id, event_id, status, champion_branch_id")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "Failed to create knockout bracket");
  }

  return {
    id: created.id,
    event_id: created.event_id,
    status: created.status as SdKnockoutBracket["status"],
    champion_branch_id: created.champion_branch_id,
  };
}

async function loadMatches(eventId: string): Promise<SdKnockoutMatch[]> {
  const service = await createServiceClient();
  const { data } = await service
    .from("sd_knockout_matches")
    .select(
      "id, event_id, round, match_index, entrant_a_branch_id, entrant_b_branch_id, winner_branch_id, status, published_at"
    )
    .eq("event_id", eventId)
    .order("round")
    .order("match_index");

  return (data ?? []).map((row) => ({
    id: row.id,
    event_id: row.event_id,
    round: row.round as SdKnockoutMatch["round"],
    match_index: row.match_index,
    entrant_a_branch_id: row.entrant_a_branch_id,
    entrant_b_branch_id: row.entrant_b_branch_id,
    winner_branch_id: row.winner_branch_id,
    status: row.status as SdKnockoutMatch["status"],
    published_at: row.published_at,
  }));
}

/** Re-seed bracket when nationals field locks or changes. */
export async function syncKnockoutBracket(
  eventId: string,
  model: NationalsWildcardModel
): Promise<void> {
  const service = await createServiceClient();
  const bracket = await getOrCreateBracket(eventId);
  const now = new Date().toISOString();

  if (!model.allFieldLocked) {
    await service
      .from("sd_knockout_brackets")
      .update({
        status: "pending",
        champion_branch_id: null,
        updated_at: now,
      })
      .eq("id", bracket.id);

    const { data: matchRows } = await service
      .from("sd_knockout_matches")
      .select("id")
      .eq("event_id", eventId);

    const matchIds = (matchRows ?? []).map((m) => m.id);
    if (matchIds.length > 0) {
      await service.from("sd_knockout_match_scores").delete().in("match_id", matchIds);
      await service.from("sd_knockout_matches").delete().eq("event_id", eventId);
    }
    return;
  }

  const entrants = buildKnockoutEntrantsFromModel(model);
  const fieldSize = entrants.length;
  const counts = knockoutMatchCounts(fieldSize);

  await service
    .from("sd_knockout_brackets")
    .update({ status: "active", updated_at: now })
    .eq("id", bracket.id);

  const existing = await loadMatches(eventId);
  const publishedIds = new Set(
    existing.filter((m) => m.status === "published").map((m) => m.id)
  );

  if (publishedIds.size > 0) {
    const r16Published = existing.some(
      (m) => m.round === "r16" && m.status === "published"
    );
    const r16EntrantKey = entrants
      .slice(0, fieldSize)
      .map((e) => e.id)
      .join(",");
    const storedR16 = existing
      .filter((m) => m.round === "r16")
      .flatMap((m) => [m.entrant_a_branch_id, m.entrant_b_branch_id])
      .filter(Boolean)
      .join(",");

    if (r16Published && r16EntrantKey !== storedR16) {
      throw new Error(
        "Cannot re-seed knockout while Round of 16 matches are published. Unpublish knockout matches first."
      );
    }
  }

  for (let r = 0; r < KNOCKOUT_ROUND_ORDER.length && r < counts.length; r++) {
    const round = KNOCKOUT_ROUND_ORDER[r]!;
    const matchCount = counts[r]!;

    for (let i = 0; i < matchCount; i++) {
      const existingMatch = existing.find(
        (m) => m.round === round && m.match_index === i
      );

      if (existingMatch?.status === "published") continue;

      let entrantA: string | null = null;
      let entrantB: string | null = null;

      if (round === "r16") {
        entrantA = entrants[i * 2]?.id ?? null;
        entrantB = entrants[i * 2 + 1]?.id ?? null;
      }

      if (existingMatch) {
        await service
          .from("sd_knockout_matches")
          .update({
            entrant_a_branch_id:
              round === "r16" ? entrantA : existingMatch.entrant_a_branch_id,
            entrant_b_branch_id:
              round === "r16" ? entrantB : existingMatch.entrant_b_branch_id,
            updated_at: now,
          })
          .eq("id", existingMatch.id);
      } else {
        await service.from("sd_knockout_matches").insert({
          event_id: eventId,
          round,
          match_index: i,
          entrant_a_branch_id: entrantA,
          entrant_b_branch_id: entrantB,
          status: "draft",
        });
      }
    }
  }
}

export async function loadKnockoutMatchScores(
  matchIds: string[]
): Promise<Map<string, SdKnockoutMatchScore[]>> {
  if (matchIds.length === 0) return new Map();
  const service = await createServiceClient();
  const { data } = await service
    .from("sd_knockout_match_scores")
    .select("match_id, branch_id, points")
    .in("match_id", matchIds);

  const map = new Map<string, SdKnockoutMatchScore[]>();
  for (const row of data ?? []) {
    const list = map.get(row.match_id) ?? [];
    list.push({
      branch_id: row.branch_id,
      points: Number(row.points),
    });
    map.set(row.match_id, list);
  }
  return map;
}

export async function saveKnockoutMatchScores(
  matchId: string,
  scores: { branch_id: string; points: number }[]
): Promise<void> {
  const service = await createServiceClient();
  const now = new Date().toISOString();

  const { data: match } = await service
    .from("sd_knockout_matches")
    .select("id, status, entrant_a_branch_id, entrant_b_branch_id")
    .eq("id", matchId)
    .single();

  if (!match) throw new Error("Match not found");
  if (match.status === "published") {
    throw new Error("Unpublish this match before editing scores");
  }
  if (!match.entrant_a_branch_id || !match.entrant_b_branch_id) {
    throw new Error("Both entrants must be set before scoring");
  }

  for (const row of scores) {
    const { error } = await service.from("sd_knockout_match_scores").upsert(
      {
        match_id: matchId,
        branch_id: row.branch_id,
        points: row.points,
        updated_at: now,
      },
      { onConflict: "match_id,branch_id" }
    );
    if (error) throw new Error(error.message);
  }
}

async function hasPublishedDescendant(
  eventId: string,
  round: KnockoutRoundKey,
  matchIndex: number
): Promise<boolean> {
  const slot = advancementSlot(round, matchIndex);
  if (!slot) return false;

  const service = await createServiceClient();
  const { data: nextMatch } = await service
    .from("sd_knockout_matches")
    .select("id, status, round, match_index")
    .eq("event_id", eventId)
    .eq("round", slot.round)
    .eq("match_index", slot.matchIndex)
    .maybeSingle();

  if (!nextMatch) return false;
  if (nextMatch.status === "published") return true;

  return hasPublishedDescendant(
    eventId,
    slot.round as KnockoutRoundKey,
    slot.matchIndex
  );
}

export async function publishKnockoutMatch(matchId: string): Promise<void> {
  const service = await createServiceClient();
  const now = new Date().toISOString();

  const { data: match } = await service
    .from("sd_knockout_matches")
    .select(
      "id, event_id, round, match_index, entrant_a_branch_id, entrant_b_branch_id, status"
    )
    .eq("id", matchId)
    .single();

  if (!match) throw new Error("Match not found");
  if (match.status === "published") throw new Error("Match already published");
  if (!match.entrant_a_branch_id || !match.entrant_b_branch_id) {
    throw new Error("Both entrants required before publishing");
  }

  const { data: scoreRows } = await service
    .from("sd_knockout_match_scores")
    .select("branch_id, points")
    .eq("match_id", matchId);

  const scoreMap: Record<string, number> = {};
  for (const row of scoreRows ?? []) {
    scoreMap[row.branch_id] = Number(row.points);
  }

  const winnerId = pickKnockoutMatchWinner(
    match.entrant_a_branch_id,
    match.entrant_b_branch_id,
    scoreMap
  );

  const { error } = await service
    .from("sd_knockout_matches")
    .update({
      status: "published",
      winner_branch_id: winnerId,
      published_at: now,
      updated_at: now,
    })
    .eq("id", matchId);

  if (error) throw new Error(error.message);

  const slot = advancementSlot(match.round as KnockoutRoundKey, match.match_index);
  if (slot) {
    const sideCol =
      slot.side === "a" ? "entrant_a_branch_id" : "entrant_b_branch_id";
    const { data: nextMatch } = await service
      .from("sd_knockout_matches")
      .select("id")
      .eq("event_id", match.event_id)
      .eq("round", slot.round)
      .eq("match_index", slot.matchIndex)
      .maybeSingle();

    if (nextMatch) {
      await service
        .from("sd_knockout_matches")
        .update({ [sideCol]: winnerId, updated_at: now })
        .eq("id", nextMatch.id);
    }
  } else {
    await service
      .from("sd_knockout_brackets")
      .update({
        status: "complete",
        champion_branch_id: winnerId,
        updated_at: now,
      })
      .eq("event_id", match.event_id);
  }
}

export async function unpublishKnockoutMatch(matchId: string): Promise<void> {
  const service = await createServiceClient();
  const now = new Date().toISOString();

  const { data: match } = await service
    .from("sd_knockout_matches")
    .select("id, event_id, round, match_index, status")
    .eq("id", matchId)
    .single();

  if (!match) throw new Error("Match not found");
  if (match.status !== "published") throw new Error("Match is not published");

  const hasDesc = await hasPublishedDescendant(
    match.event_id,
    match.round as KnockoutRoundKey,
    match.match_index
  );
  if (hasDesc) {
    throw new Error(
      "Unpublish later-round matches before reverting this result"
    );
  }

  await service
    .from("sd_knockout_matches")
    .update({
      status: "draft",
      winner_branch_id: null,
      published_at: null,
      updated_at: now,
    })
    .eq("id", matchId);

  const slot = advancementSlot(match.round as KnockoutRoundKey, match.match_index);
  if (slot) {
    const sideCol =
      slot.side === "a" ? "entrant_a_branch_id" : "entrant_b_branch_id";
    const { data: nextMatch } = await service
      .from("sd_knockout_matches")
      .select("id, status")
      .eq("event_id", match.event_id)
      .eq("round", slot.round)
      .eq("match_index", slot.matchIndex)
      .maybeSingle();

    if (nextMatch && nextMatch.status === "draft") {
      await service
        .from("sd_knockout_matches")
        .update({ [sideCol]: null, updated_at: now })
        .eq("id", nextMatch.id);
    }
  }

  if (match.round === "final") {
    await service
      .from("sd_knockout_brackets")
      .update({
        status: "active",
        champion_branch_id: null,
        updated_at: now,
      })
      .eq("event_id", match.event_id);
  }
}

export async function trySyncKnockoutBracket(
  eventId: string
): Promise<void> {
  try {
    const { getSdNationalsContext } = await import("./nationals-queries");
    const ctx = await getSdNationalsContext(eventId);
    await syncKnockoutBracket(eventId, ctx.model);
  } catch {
    /* knockout tables may not exist until migration 020 */
  }
}

export async function loadKnockoutBracketState(eventId: string): Promise<{
  bracket: SdKnockoutBracket | null;
  matches: SdKnockoutMatch[];
  scoresByMatchId: Map<string, SdKnockoutMatchScore[]>;
}> {
  const service = await createServiceClient();
  const { data: bracketRow } = await service
    .from("sd_knockout_brackets")
    .select("id, event_id, status, champion_branch_id")
    .eq("event_id", eventId)
    .maybeSingle();

  let matches: SdKnockoutMatch[] = [];
  try {
    matches = await loadMatches(eventId);
  } catch {
    return { bracket: null, matches: [], scoresByMatchId: new Map() };
  }

  const scoresByMatchId = await loadKnockoutMatchScores(matches.map((m) => m.id));

  return {
    bracket: bracketRow
      ? {
          id: bracketRow.id,
          event_id: bracketRow.event_id,
          status: bracketRow.status as SdKnockoutBracket["status"],
          champion_branch_id: bracketRow.champion_branch_id,
        }
      : null,
    matches,
    scoresByMatchId,
  };
}
