import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { SeasonSlug } from "@/lib/scoring-config";

export async function getAdminDashboard() {
  if (!isSupabaseConfigured()) {
    return { seasons: [], branchCount: 0, rounds: [] };
  }
  const service = await createServiceClient();

  const [{ data: seasons }, { count }, { data: rounds }] = await Promise.all([
    service.from("seasons").select("*").order("sort_order"),
    service.from("branches").select("*", { count: "exact", head: true }),
    service
      .from("rounds")
      .select("id, name, round_number, status, published_at, seasons(slug, name)")
      .order("round_number"),
  ]);

  return {
    seasons: seasons ?? [],
    branchCount: count ?? 0,
    rounds: rounds ?? [],
  };
}

export async function getRoundWithResults(roundId: string) {
  if (!isSupabaseConfigured()) return null;
  const service = await createServiceClient();

  const { data: round } = await service
    .from("rounds")
    .select("id, name, round_number, status, season_id, seasons(slug)")
    .eq("id", roundId)
    .single();

  if (!round) return null;

  const seasonRaw = round.seasons as { slug: SeasonSlug } | { slug: SeasonSlug }[];
  const seasonSlug = (Array.isArray(seasonRaw) ? seasonRaw[0] : seasonRaw).slug;

  const { data: season } = await service
    .from("seasons")
    .select("id")
    .eq("slug", seasonSlug)
    .single();

  let branchIds: string[] = [];
  if (season) {
    const { data: participants } = await service
      .from("season_participants")
      .select("branch_id")
      .eq("season_id", season.id);
    branchIds = (participants ?? []).map((p) => p.branch_id);
  }

  let branchQuery = service
    .from("branches")
    .select("id, branch_code, branch_name, area, region")
    .order("branch_name");

  if (branchIds.length > 0 && seasonSlug !== "june_area") {
    branchQuery = branchQuery.in("id", branchIds);
  }

  const { data: branches } = await branchQuery;

  const { data: results } = await service
    .from("round_results")
    .select("branch_id, points, wins, losses")
    .eq("round_id", roundId);

  const resultMap = new Map(
    (results ?? []).map((r) => [
      r.branch_id,
      {
        points: Number(r.points),
        wins: r.wins,
        losses: r.losses,
      },
    ])
  );

  return {
    round,
    seasonSlug,
    branches: branches ?? [],
    resultMap,
  };
}
