import type { SeasonSlug } from "@/lib/scoring-config";

type ServiceClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createServiceClient>
>;

export const JULY_PARTICIPANT_GATE_MESSAGE =
  "July has no seeded participants yet. Publish June Round 3, then go to Admin → Advancement → Lock & advance June before scoring or publishing July rounds.";

export const AUGUST_PARTICIPANT_GATE_MESSAGE =
  "The Nationals has no seeded champions yet. Publish July Round 3, then lock & advance July before scoring or publishing Nationals rounds.";

/** Branch IDs allowed for scoring/publish in this season. */
export async function resolveParticipantBranchIds(
  service: ServiceClient,
  seasonId: string,
  seasonSlug: SeasonSlug
): Promise<string[]> {
  const { data } = await service
    .from("season_participants")
    .select("branch_id")
    .eq("season_id", seasonId);
  const ids = (data ?? []).map((r) => r.branch_id);
  if (ids.length > 0) return ids;

  if (seasonSlug === "june_area") {
    const { data: all } = await service.from("branches").select("id");
    return (all ?? []).map((b) => b.id);
  }

  return [];
}

export function participantGateMessage(seasonSlug: SeasonSlug): string | null {
  if (seasonSlug === "july_region") return JULY_PARTICIPANT_GATE_MESSAGE;
  if (seasonSlug === "august_finals") return AUGUST_PARTICIPANT_GATE_MESSAGE;
  return null;
}

/** Throws before publish/recompute when July or Nationals has no seeded roster. */
export async function assertSeasonParticipantsReady(
  service: ServiceClient,
  seasonId: string,
  seasonSlug: SeasonSlug
): Promise<void> {
  const message = participantGateMessage(seasonSlug);
  if (!message) return;

  const { count, error } = await service
    .from("season_participants")
    .select("*", { count: "exact", head: true })
    .eq("season_id", seasonId);
  if (error) throw new Error(error.message);
  if ((count ?? 0) === 0) throw new Error(message);
}
