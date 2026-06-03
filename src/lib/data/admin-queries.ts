import {
  createServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/server";
import {
  aggregatePublishedResults,
  getEligibleBranchIdsForRound,
} from "@/lib/scoring";
import type { Region } from "@/lib/scoring-config";
import type { SeasonSlug } from "@/lib/scoring-config";

export async function getAdminDashboard() {
  if (!isSupabaseServiceConfigured()) {
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
  if (!isSupabaseServiceConfigured()) return null;
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

  const { data: allBranches } = await branchQuery;
  const branches = allBranches ?? [];

  const { data: seasonRounds } = await service
    .from("rounds")
    .select("id, round_number, status")
    .eq("season_id", round.season_id);

  const publishedRoundNumbers = (seasonRounds ?? [])
    .filter((r) => r.status === "published" && r.round_number < round.round_number)
    .map((r) => r.round_number);

  const publishedRoundIds = (seasonRounds ?? [])
    .filter((r) => r.status === "published" && r.round_number < round.round_number)
    .map((r) => r.id);

  let eligibleIds = new Set(branches.map((b) => b.id));

  if (publishedRoundIds.length > 0 && round.round_number > 1) {
    const { data: priorResults } = await service
      .from("round_results")
      .select("branch_id, points, wins, losses, rounds(round_number)")
      .in("round_id", publishedRoundIds);

    const mapped = (priorResults ?? []).map((r) => ({
      branch_id: r.branch_id,
      points: Number(r.points),
      wins: r.wins,
      losses: r.losses,
      round_number: (Array.isArray(r.rounds) ? r.rounds[0] : r.rounds)
        .round_number,
    }));

    const agg = aggregatePublishedResults(mapped);
    const branchInputs = branches.map((b) => ({
      id: b.id,
      branch_code: b.branch_code,
      branch_name: b.branch_name,
      area: b.area,
      region: b.region as Region,
    }));

    eligibleIds = getEligibleBranchIdsForRound(
      seasonSlug,
      branchInputs,
      agg,
      round.round_number,
      publishedRoundNumbers
    );
  }

  const activeBranches = branches.filter((b) => eligibleIds.has(b.id));
  const eliminatedBranches = branches.filter((b) => !eligibleIds.has(b.id));

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
    branches: activeBranches,
    eliminatedBranches,
    priorRoundNumber: round.round_number > 1 ? round.round_number - 1 : null,
    resultMap,
  };
}

export async function getBranchesForRepresentatives() {
  if (!isSupabaseServiceConfigured()) {
    return { branches: [], withReps: 0, total: 0 };
  }
  const service = await createServiceClient();
  const { data, error } = await service
    .from("branches")
    .select(
      "id, branch_code, branch_name, area, region, representative_1, representative_2"
    )
    .order("area")
    .order("branch_name");

  if (error) throw error;

  const branches = data ?? [];
  const withReps = branches.filter((b) => b.representative_1?.trim()).length;

  return {
    branches,
    withReps,
    total: branches.length,
  };
}
