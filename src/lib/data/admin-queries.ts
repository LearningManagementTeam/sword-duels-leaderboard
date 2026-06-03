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

  const priorRound = round.round_number - 1;
  let tieBreakerIds = new Set<string>();
  if (
    priorRound >= 1 &&
    publishedRoundNumbers.includes(priorRound) &&
    publishedRoundIds.length > 0
  ) {
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
    const standings = computeStandings(seasonSlug, branchInputs, agg, {
      publishedRoundNumbers,
      manualAdvances,
    });
    for (const s of standings) {
      if (s.tie_breaker_in_round === priorRound) {
        tieBreakerIds.add(s.branch_id);
      }
    }
  }

  const activeBranches = branches.filter((b) => eligibleIds.has(b.id));
  const tieBreakerBranches = branches.filter((b) => tieBreakerIds.has(b.id));
  const eliminatedBranches = branches.filter(
    (b) => !eligibleIds.has(b.id) && !tieBreakerIds.has(b.id)
  );

  const { data: results } = await service
    .from("round_results")
    .select("branch_id, points, wins, losses, finish_order")
    .eq("round_id", roundId);

  const resultMap = new Map(
    (results ?? []).map((r) => [
      r.branch_id,
      {
        points: Number(r.points),
        wins: r.wins,
        losses: r.losses,
        finish_order: r.finish_order ?? null,
      },
    ])
  );

  return {
    round,
    seasonSlug,
    branches: activeBranches,
    tieBreakerBranches,
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
  isTieBreaker?: boolean;
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
  const maxPoints =
    mechanics?.kind === "quiz"
      ? mechanics.maxPoints
      : mechanics?.kind === "race_to_correct"
        ? mechanics.maxCorrect
        : null;

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
      .filter(
        (r) =>
          r.eliminated_in_round === round.round_number ||
          r.tie_breaker_in_round === round.round_number
      )
      .map((r) => ({
        branch_id: r.branch_id,
        branch_name: r.branch_name,
        branch_code: r.branch_code,
        points: pointsForRound(r.branch_id),
        wins: 0,
        rank: r.rank,
        isTieBreaker: r.tie_breaker_in_round === round.round_number,
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
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

export interface PhaseLockOverview {
  seasonSlug: "june_area" | "july_region";
  name: string;
  description: string;
  lockedAt: string | null;
  lockedByEmail: string | null;
  round3Published: boolean;
  seedCount: number | null;
}

export async function getPhaseLockOverview(): Promise<PhaseLockOverview[]> {
  if (!isSupabaseServiceConfigured()) return [];
  const service = await createServiceClient();

  const phases: {
    slug: "june_area" | "july_region";
    description: string;
  }[] = [
    {
      slug: "june_area",
      description:
        "Lock June and seed the top 24 branches into July regional competition.",
    },
    {
      slug: "july_region",
      description:
        "Lock July and seed regional champions (Luzon, NCR, VisMin) into August finals.",
    },
  ];

  const result: PhaseLockOverview[] = [];

  for (const phase of phases) {
    const { data: season } = await service
      .from("seasons")
      .select("id, name")
      .eq("slug", phase.slug)
      .maybeSingle();
    if (!season) continue;

    const [{ data: lock }, { data: r3 }] = await Promise.all([
      service
        .from("phase_locks")
        .select("locked_at, locked_by_email")
        .eq("season_id", season.id)
        .maybeSingle(),
      service
        .from("rounds")
        .select("status")
        .eq("season_id", season.id)
        .eq("round_number", 3)
        .maybeSingle(),
    ]);

    let seedCount: number | null = null;
    if (phase.slug === "june_area") {
      const { count } = await service
        .from("published_standings")
        .select("*", { count: "exact", head: true })
        .eq("season_id", season.id)
        .eq("status", "advanced");
      seedCount = count;
    } else {
      const { data: winners } = await service
        .from("published_standings")
        .select("branch_id")
        .eq("season_id", season.id)
        .eq("rank", 1)
        .not("region_filter", "is", null);
      seedCount = winners?.length ?? 0;
    }

    result.push({
      seasonSlug: phase.slug,
      name: season.name,
      description: phase.description,
      lockedAt: lock?.locked_at ?? null,
      lockedByEmail: lock?.locked_by_email ?? null,
      round3Published: r3?.status === "published",
      seedCount,
    });
  }

  return result;
}
