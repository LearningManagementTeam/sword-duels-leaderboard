import {
  createServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/server";
import {
  aggregatePublishedResults,
  computeStandings,
  getEligibleBranchIdsForRound,
} from "@/lib/scoring";
import type { Region } from "@/lib/scoring-config";
import type { SeasonSlug } from "@/lib/scoring-config";
import {
  getRoundMechanics,
  getSurvivorCount,
  usesPerRoundElimination,
} from "@/lib/scoring-config";
import type { ManualAdvance } from "@/lib/manual-advances";
import type { StandingRow } from "@/lib/types";

async function fetchManualAdvances(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  seasonId: string
): Promise<ManualAdvance[]> {
  const { data, error } = await service
    .from("manual_round_advances")
    .select("round_number, region, branch_id")
    .eq("season_id", seasonId);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    round_number: row.round_number,
    region: row.region as Region,
    branch_id: row.branch_id,
  }));
}

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
  const manualAdvances = season
    ? await fetchManualAdvances(service, season.id)
    : [];

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
      publishedRoundNumbers,
      manualAdvances
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
    supportsManualAdvances:
      usesPerRoundElimination(seasonSlug) && round.status === "published",
  };
}

export interface AdvancementPickBranch {
  branch_id: string;
  branch_name: string;
  branch_code: string;
  points: number;
  wins: number;
  rank: number;
}

export async function getAdvancementPickContext(roundId: string) {
  if (!isSupabaseServiceConfigured()) return null;
  const service = await createServiceClient();

  const { data: round } = await service
    .from("rounds")
    .select("id, name, round_number, status, season_id, seasons(slug, name)")
    .eq("id", roundId)
    .single();

  if (!round) return null;

  const seasonRaw = round.seasons as
    | { slug: SeasonSlug; name: string }
    | { slug: SeasonSlug; name: string }[];
  const seasonMeta = Array.isArray(seasonRaw) ? seasonRaw[0] : seasonRaw;
  const seasonSlug = seasonMeta.slug;

  if (!usesPerRoundElimination(seasonSlug) || round.status !== "published") {
    return null;
  }

  const participantIds = await getParticipantBranchIdsForSeason(
    service,
    round.season_id,
    seasonSlug
  );

  let branchQuery = service
    .from("branches")
    .select("id, branch_code, branch_name, area, region")
    .order("branch_name");
  if (participantIds.length > 0) {
    branchQuery = branchQuery.in("id", participantIds);
  }
  const { data: branchList } = await branchQuery;
  const branchInputs =
    branchList?.map((b) => ({
      id: b.id,
      branch_code: b.branch_code,
      branch_name: b.branch_name,
      area: b.area,
      region: b.region as Region,
    })) ?? [];

  const { data: publishedRounds } = await service
    .from("rounds")
    .select("id, round_number")
    .eq("season_id", round.season_id)
    .eq("status", "published");

  const publishedRoundNumbers = (publishedRounds ?? [])
    .map((r) => r.round_number)
    .filter((n) => n <= round.round_number)
    .sort((a, b) => a - b);

  const roundIds = (publishedRounds ?? [])
    .filter((r) => r.round_number <= round.round_number)
    .map((r) => r.id);

  const { data: results } = await service
    .from("round_results")
    .select("branch_id, points, wins, losses, rounds(round_number)")
    .in("round_id", roundIds.length ? roundIds : ["00000000-0000-0000-0000-000000000000"]);

  const mapped = (results ?? []).map((r) => ({
    branch_id: r.branch_id,
    points: Number(r.points),
    wins: r.wins,
    losses: r.losses,
    round_number: (Array.isArray(r.rounds) ? r.rounds[0] : r.rounds).round_number,
  }));

  const agg = aggregatePublishedResults(mapped);
  const manualAdvances = await fetchManualAdvances(service, round.season_id);
  const mechanics = getRoundMechanics(seasonSlug, round.round_number);
  const maxPoints = mechanics?.maxPoints ?? null;

  const pointsForRound = (branchId: string) => {
    const rp = (agg.get(branchId) ?? []).find(
      (r) => r.round_number === round.round_number
    );
    return rp?.points ?? 0;
  };

  const winsForRound = (branchId: string) => {
    const rp = (agg.get(branchId) ?? []).find(
      (r) => r.round_number === round.round_number
    );
    return rp?.wins ?? 0;
  };

  const regions: Record<
    Region,
    {
      autoAdvanced: AdvancementPickBranch[];
      eligibleExtra: AdvancementPickBranch[];
      selectedIds: string[];
      survivorCut: number;
      maxScoreCount: number;
    }
  > = {
    luzon: {
      autoAdvanced: [],
      eligibleExtra: [],
      selectedIds: [],
      survivorCut: getSurvivorCount(seasonSlug, round.round_number, "luzon") ?? 0,
      maxScoreCount: 0,
    },
    ncr: {
      autoAdvanced: [],
      eligibleExtra: [],
      selectedIds: [],
      survivorCut: getSurvivorCount(seasonSlug, round.round_number, "ncr") ?? 0,
      maxScoreCount: 0,
    },
    vismin: {
      autoAdvanced: [],
      eligibleExtra: [],
      selectedIds: [],
      survivorCut: getSurvivorCount(seasonSlug, round.round_number, "vismin") ?? 0,
      maxScoreCount: 0,
    },
  };

  for (const region of ["luzon", "ncr", "vismin"] as Region[]) {
    const autoOnly = computeStandings(seasonSlug, branchInputs, agg, {
      filterRegion: region,
      publishedRoundNumbers,
      manualAdvances: [],
    });

    const autoAdvanced = autoOnly
      .filter((r) => r.eliminated_in_round === null)
      .map((r) => ({
        branch_id: r.branch_id,
        branch_name: r.branch_name,
        branch_code: r.branch_code,
        points: pointsForRound(r.branch_id),
        wins: winsForRound(r.branch_id),
        rank: r.rank,
      }));

    const eligibleExtra = autoOnly
      .filter((r) => r.eliminated_in_round === round.round_number)
      .map((r) => ({
        branch_id: r.branch_id,
        branch_name: r.branch_name,
        branch_code: r.branch_code,
        points: pointsForRound(r.branch_id),
        wins: winsForRound(r.branch_id),
        rank: r.rank,
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return a.branch_name.localeCompare(b.branch_name);
      });

    regions[region].autoAdvanced = autoAdvanced;
    regions[region].eligibleExtra = eligibleExtra;
    regions[region].selectedIds = manualAdvances
      .filter(
        (m) => m.round_number === round.round_number && m.region === region
      )
      .map((m) => m.branch_id);
    if (maxPoints != null) {
      regions[region].maxScoreCount = eligibleExtra.filter(
        (b) => b.points >= maxPoints
      ).length;
    }
  }

  return {
    round,
    seasonSlug,
    seasonName: seasonMeta.name,
    mechanics,
    maxPoints,
    nextRound: round.round_number + 1,
    regions,
  };
}

async function getParticipantBranchIdsForSeason(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  seasonId: string,
  seasonSlug: SeasonSlug
) {
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
