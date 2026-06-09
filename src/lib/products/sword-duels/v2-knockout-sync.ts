import type { Region } from "@/lib/scoring-config";
import { REGIONS } from "@/lib/scoring-config";
import { createServiceClient } from "@/lib/supabase/server";
import type { NationalsEntrant } from "./nationals-entrant";
import { buildV2KnockoutEntrants } from "./v2-nationals";
import { loadNationalsRoster } from "./nationals-wildcard-data";
import { getSdSetsForEvent, getSdSetScores, scoresBySetId } from "./queries";

async function getOrCreateBracket(eventId: string) {
  const service = await createServiceClient();
  const { data: existing } = await service
    .from("sd_knockout_brackets")
    .select("id, event_id, status, champion_branch_id")
    .eq("event_id", eventId)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await service
    .from("sd_knockout_brackets")
    .insert({ event_id: eventId, status: "pending" })
    .select("id, event_id, status, champion_branch_id")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "Failed to create knockout bracket");
  }
  return created;
}

/** V2 finals: semifinal (2 regions) + final (winner vs 3rd region). */
export async function syncV2KnockoutBracket(eventId: string): Promise<void> {
  const service = await createServiceClient();
  const now = new Date().toISOString();

  const [roster, sets, scoreRows] = await Promise.all([
    loadNationalsRoster(eventId),
    getSdSetsForEvent(eventId),
    getSdSetScores(
      (await getSdSetsForEvent(eventId))
        .filter((s) => s.set_type.startsWith("regional_"))
        .map((s) => s.id)
    ),
  ]);

  const scoreMap = scoresBySetId(scoreRows);
  const entrants = buildV2KnockoutEntrants({
    areaReps: roster.areaReps,
    sets,
    scoreMap,
  });

  const bracket = await getOrCreateBracket(eventId);

  if (entrants.length < REGIONS.length) {
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

  const byRegion = new Map<Region, NationalsEntrant>();
  for (const e of entrants) {
    byRegion.set(e.region, e);
  }
  const luzon = byRegion.get("luzon")!;
  const ncr = byRegion.get("ncr")!;
  const vismin = byRegion.get("vismin")!;

  await service
    .from("sd_knockout_brackets")
    .update({ status: "active", updated_at: now })
    .eq("id", bracket.id);

  const { data: existing } = await service
    .from("sd_knockout_matches")
    .select("id, round, match_index, status")
    .eq("event_id", eventId);

  const published = new Set(
    (existing ?? [])
      .filter((m) => m.status === "published")
      .map((m) => `${m.round}:${m.match_index}`)
  );

  if (published.size > 0) return;

  const matchIds = (existing ?? []).map((m) => m.id);
  if (matchIds.length > 0) {
    await service.from("sd_knockout_match_scores").delete().in("match_id", matchIds);
    await service.from("sd_knockout_matches").delete().eq("event_id", eventId);
  }

  await service.from("sd_knockout_matches").insert([
    {
      event_id: eventId,
      round: "sf",
      match_index: 0,
      entrant_a_branch_id: luzon.id,
      entrant_b_branch_id: ncr.id,
      status: "draft",
    },
    {
      event_id: eventId,
      round: "final",
      match_index: 0,
      entrant_a_branch_id: null,
      entrant_b_branch_id: vismin.id,
      status: "draft",
    },
  ]);
}

export async function trySyncV2KnockoutBracket(eventId: string): Promise<void> {
  try {
    await syncV2KnockoutBracket(eventId);
  } catch {
    /* knockout tables may not exist until migration 020 */
  }
}
