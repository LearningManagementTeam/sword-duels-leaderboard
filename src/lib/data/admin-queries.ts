import {
  createServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/server";
import { BRANCH_WITH_REPS_SELECT } from "@/lib/representative-fields";
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
import {
  participantGateMessage,
  resolveParticipantBranchIds,
} from "@/lib/season-participants";
import { TARGET_BRANCH_COUNT } from "@/lib/branch-targets";
import { seasonPhaseLabel } from "@/lib/season-labels";

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

export type DashboardRoundRow = {
  id: string;
  name: string;
  round_number: number;
  status: string;
  published_at: string | null;
  created_at: string;
  seasons: { slug: string; name: string } | { slug: string; name: string }[] | null;
};

export type DashboardPhaseStatus = {
  seasonSlug: SeasonSlug;
  label: string;
  subtitle: string;
  rosterCount: number;
  rosterTarget: number;
  rosterLabel: string;
  lockedAt: string | null;
  round3Published: boolean;
  round3Round: { id: string; name: string; status: string } | null;
  latestPublishedRound: {
    id: string;
    name: string;
    published_at: string;
  } | null;
  needsAttention: boolean;
  attentionMessage: string | null;
  attentionHref: string | null;
};

function seasonMeta(
  seasons: DashboardRoundRow["seasons"]
): { slug: SeasonSlug; name: string } | null {
  if (!seasons) return null;
  const raw = Array.isArray(seasons) ? seasons[0] : seasons;
  if (!raw?.slug) return null;
  return { slug: raw.slug as SeasonSlug, name: raw.name };
}

function sortRoundsForRecency(rows: DashboardRoundRow[]): DashboardRoundRow[] {
  return [...rows].sort((a, b) => {
    const aTime = a.published_at ?? a.created_at;
    const bTime = b.published_at ?? b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

function latestPublishedForSeason(
  rows: DashboardRoundRow[],
  seasonSlug: SeasonSlug
): DashboardPhaseStatus["latestPublishedRound"] {
  const match = rows
    .filter((r) => {
      const meta = seasonMeta(r.seasons);
      return meta?.slug === seasonSlug && r.status === "published" && r.published_at;
    })
    .sort(
      (a, b) =>
        new Date(b.published_at!).getTime() - new Date(a.published_at!).getTime()
    )[0];
  if (!match?.published_at) return null;
  return {
    id: match.id,
    name: match.name,
    published_at: match.published_at,
  };
}

async function buildDashboardPhaseStatuses(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  branchCount: number,
  rounds: DashboardRoundRow[]
): Promise<DashboardPhaseStatus[]> {
  const slugs: SeasonSlug[] = ["june_area", "july_region", "august_finals"];
  const rosterTargets: Record<SeasonSlug, number> = {
    june_area: TARGET_BRANCH_COUNT,
    july_region: 24,
    august_finals: 3,
  };
  const subtitles: Record<SeasonSlug, string> = {
    june_area: "Area-wide · all branches",
    july_region: "Regional · 24 survivors",
    august_finals: "The Nationals · 3 champions",
  };

  const { data: seasons } = await service
    .from("seasons")
    .select("id, slug")
    .in("slug", slugs);

  const seasonBySlug = new Map(
    (seasons ?? []).map((s) => [s.slug as SeasonSlug, s.id as string])
  );

  const statuses: DashboardPhaseStatus[] = [];

  for (const seasonSlug of slugs) {
    const seasonId = seasonBySlug.get(seasonSlug);
    let rosterCount = 0;
    let lockedAt: string | null = null;
    let round3Published = false;
    let round3Round: DashboardPhaseStatus["round3Round"] = null;

    if (seasonId) {
      if (seasonSlug === "june_area") {
        rosterCount = branchCount;
      } else {
        const { count } = await service
          .from("season_participants")
          .select("*", { count: "exact", head: true })
          .eq("season_id", seasonId);
        rosterCount = count ?? 0;
      }

      if (seasonSlug !== "august_finals") {
        const { data: lock } = await service
          .from("phase_locks")
          .select("locked_at")
          .eq("season_id", seasonId)
          .maybeSingle();
        lockedAt = lock?.locked_at ?? null;
      }

      const { data: r3 } = await service
        .from("rounds")
        .select("id, name, status")
        .eq("season_id", seasonId)
        .eq("round_number", 3)
        .maybeSingle();
      round3Published = r3?.status === "published";
      if (r3) {
        round3Round = { id: r3.id, name: r3.name, status: r3.status };
      }
    }

    const rosterTarget = rosterTargets[seasonSlug];
    const latestPublishedRound = latestPublishedForSeason(rounds, seasonSlug);
    let needsAttention = false;
    let attentionMessage: string | null = null;
    let attentionHref: string | null = null;

    if (seasonSlug === "june_area") {
      if (branchCount > 0 && branchCount < TARGET_BRANCH_COUNT) {
        needsAttention = true;
        attentionMessage = `${branchCount} of ${TARGET_BRANCH_COUNT} branches loaded`;
        attentionHref = "/admin/national-competitions/branches";
      } else if (!round3Published && round3Round) {
        needsAttention = true;
        attentionMessage = "Publish June Round 3 before locking the phase";
        attentionHref = `/admin/national-competitions/rounds/${round3Round.id}`;
      } else if (round3Published && !lockedAt) {
        needsAttention = true;
        attentionMessage = "June Round 3 is live — lock & advance to July";
        attentionHref = "/admin/national-competitions/advancement";
      }
    } else if (seasonSlug === "july_region") {
      const gate = participantGateMessage(seasonSlug);
      if (rosterCount === 0 && gate) {
        needsAttention = true;
        attentionMessage = "No July roster yet — lock June first";
        attentionHref = "/admin/national-competitions/advancement";
      } else if (!round3Published && round3Round) {
        needsAttention = true;
        attentionMessage = "Publish July Round 3 before locking the phase";
        attentionHref = `/admin/national-competitions/rounds/${round3Round.id}`;
      } else if (round3Published && !lockedAt) {
        needsAttention = true;
        attentionMessage = "July Round 3 is live — lock & advance to The Nationals";
        attentionHref = "/admin/national-competitions/advancement";
      } else if (lockedAt && rosterCount > 0 && rosterCount !== rosterTarget) {
        needsAttention = true;
        attentionMessage = `${rosterCount} participants seeded (expect ${rosterTarget})`;
        attentionHref = "/admin/national-competitions/advancement";
      }
    } else {
      const gate = participantGateMessage(seasonSlug);
      if (rosterCount === 0 && gate) {
        needsAttention = true;
        attentionMessage = "No Nationals roster yet — lock July first";
        attentionHref = "/admin/national-competitions/advancement";
      } else if (rosterCount > 0 && rosterCount !== rosterTarget) {
        needsAttention = true;
        attentionMessage = `${rosterCount} champions seeded (expect ${rosterTarget})`;
        attentionHref = "/admin/national-competitions/advancement";
      }
    }

    statuses.push({
      seasonSlug,
      label: seasonPhaseLabel(seasonSlug),
      subtitle: subtitles[seasonSlug],
      rosterCount,
      rosterTarget,
      rosterLabel: seasonSlug === "june_area" ? "Branches" : "Participants",
      lockedAt,
      round3Published,
      round3Round,
      latestPublishedRound,
      needsAttention,
      attentionMessage,
      attentionHref,
    });
  }

  return statuses;
}

export async function getAdminDashboard() {
  if (!isSupabaseServiceConfigured()) {
    return {
      seasons: [],
      branchCount: 0,
      rounds: [] as DashboardRoundRow[],
      recentRounds: [] as DashboardRoundRow[],
      phaseStatuses: [] as DashboardPhaseStatus[],
      latestPublishedRoundForAdvances: null,
      nextDraftRound: null,
    };
  }
  const service = await createServiceClient();

  const [{ data: seasons }, { count }, { data: rounds }] = await Promise.all([
    service.from("seasons").select("*").order("sort_order"),
    service
      .from("branches")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    service
      .from("rounds")
      .select(
        "id, name, round_number, status, published_at, created_at, seasons(slug, name)"
      )
      .order("round_number"),
  ]);

  const roundRows = (rounds ?? []) as DashboardRoundRow[];
  const branchCount = count ?? 0;
  const phaseStatuses = await buildDashboardPhaseStatuses(
    service,
    branchCount,
    roundRows
  );

  const [nextDraftRound, latestPublishedRoundForAdvances] = await Promise.all([
    Promise.resolve(pickNextDraftRound(roundRows)),
    findRoundNeedingAdvances(roundRows),
  ]);

  return {
    seasons: seasons ?? [],
    branchCount,
    rounds: roundRows,
    recentRounds: sortRoundsForRecency(roundRows).slice(0, 8),
    phaseStatuses,
    nextDraftRound,
    latestPublishedRoundForAdvances,
  };
}

export type PublishedRoundRef = {
  id: string;
  name: string;
  seasons: { name: string; slug?: string } | { name: string; slug?: string }[] | null;
};

export type NextDraftRoundRef = {
  id: string;
  name: string;
  seasonSlug: SeasonSlug;
  roundNumber: number;
};

const SEASON_SORT_ORDER: Record<SeasonSlug, number> = {
  june_area: 0,
  july_region: 1,
  august_finals: 2,
};

function pickNextDraftRound(rounds: DashboardRoundRow[]): NextDraftRoundRef | null {
  const drafts = rounds
    .filter((r) => r.status !== "published")
    .map((r) => ({ round: r, meta: seasonMeta(r.seasons) }))
    .filter((entry): entry is { round: DashboardRoundRow; meta: { slug: SeasonSlug; name: string } } =>
      entry.meta != null
    )
    .sort((a, b) => {
      const seasonDiff =
        SEASON_SORT_ORDER[a.meta.slug] - SEASON_SORT_ORDER[b.meta.slug];
      if (seasonDiff !== 0) return seasonDiff;
      return a.round.round_number - b.round.round_number;
    });

  const first = drafts[0];
  if (!first) return null;
  return {
    id: first.round.id,
    name: first.round.name,
    seasonSlug: first.meta.slug,
    roundNumber: first.round.round_number,
  };
}

function roundNeedsAdvancementPicks(
  regions: Record<
    Region,
    {
      eligibleExtra: Array<{ isTieBreaker?: boolean }>;
      maxScoreCount: number;
    }
  >
): boolean {
  for (const region of ["luzon", "ncr", "vismin"] as Region[]) {
    const data = regions[region];
    if (data.maxScoreCount > 0) return true;
    if (data.eligibleExtra.some((b) => b.isTieBreaker)) return true;
  }
  return false;
}

async function findRoundNeedingAdvances(
  rounds: DashboardRoundRow[]
): Promise<PublishedRoundRef | null> {
  const candidates = rounds
    .filter((r) => r.status === "published" && r.published_at)
    .filter((r) => {
      const meta = seasonMeta(r.seasons);
      return meta?.slug === "june_area" || meta?.slug === "july_region";
    })
    .sort((a, b) => {
      const metaA = seasonMeta(a.seasons)!;
      const metaB = seasonMeta(b.seasons)!;
      const seasonDiff =
        SEASON_SORT_ORDER[metaA.slug] - SEASON_SORT_ORDER[metaB.slug];
      if (seasonDiff !== 0) return seasonDiff;
      return a.round_number - b.round_number;
    });

  for (const round of candidates) {
    const ctx = await getAdvancementPickContext(round.id);
    if (ctx && roundNeedsAdvancementPicks(ctx.regions)) {
      return {
        id: round.id,
        name: round.name,
        seasons: round.seasons,
      };
    }
  }

  return null;
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
    branchIds = await resolveParticipantBranchIds(
      service,
      season.id,
      seasonSlug
    );
  }

  const gateMessage =
    branchIds.length === 0 ? participantGateMessage(seasonSlug) : null;

  let branchQuery = service
    .from("branches")
    .select("id, branch_code, branch_name, area, region")
    .order("branch_name");

  if (branchIds.length > 0) {
    branchQuery = branchQuery.in("id", branchIds);
  } else if (seasonSlug !== "june_area") {
    branchQuery = branchQuery.in("id", ["00000000-0000-0000-0000-000000000000"]);
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
    participantGateMessage: gateMessage,
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
  return resolveParticipantBranchIds(service, seasonId, seasonSlug);
}

export async function getBranchesForRepresentatives() {
  if (!isSupabaseServiceConfigured()) {
    return { branches: [], withReps: 0, total: 0 };
  }
  const service = await createServiceClient();
  const { data, error } = await service
    .from("branches")
    .select(BRANCH_WITH_REPS_SELECT)
    .eq("is_active", true)
    .order("area")
    .order("branch_name");

  if (error) throw error;

  const { enrichBranchesWithRepEmployees } = await import("@/lib/employees");
  const branches = await enrichBranchesWithRepEmployees((data ?? []) as import("@/lib/types").Branch[]);
  const withReps = branches.filter((b) => b.representative_1?.trim()).length;

  return {
    branches,
    withReps,
    total: branches.length,
  };
}

export async function getBranchesForRosterAdmin() {
  if (!isSupabaseServiceConfigured()) {
    return { branches: [], activeCount: 0, inactiveCount: 0, total: 0 };
  }
  const service = await createServiceClient();
  const { data, error } = await service
    .from("branches")
    .select(`${BRANCH_WITH_REPS_SELECT}, is_active`)
    .order("is_active", { ascending: false })
    .order("area")
    .order("branch_name");

  if (error) throw error;

  const { enrichBranchesWithRepEmployees } = await import("@/lib/employees");
  const branches = await enrichBranchesWithRepEmployees(
    (data ?? []).map((row) => ({
      ...row,
      is_active: row.is_active !== false,
    })) as import("@/lib/types").Branch[]
  );
  const activeCount = branches.filter((b) => b.is_active).length;

  return {
    branches,
    activeCount,
    inactiveCount: branches.length - activeCount,
    total: branches.length,
  };
}

export type PhaseLockSeedBranch = {
  branch_name: string;
  branch_code: string;
  region: Region | null;
};

export interface PhaseLockOverview {
  seasonSlug: "june_area" | "july_region";
  name: string;
  description: string;
  lockedAt: string | null;
  lockedByEmail: string | null;
  round3Published: boolean;
  round3Round: { id: string; name: string; status: string } | null;
  seedCount: number | null;
  seedPreview: PhaseLockSeedBranch[];
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
        "Lock July and seed regional champions (Luzon, NCR, VisMin) into The Nationals.",
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
        .select("id, name, status")
        .eq("season_id", season.id)
        .eq("round_number", 3)
        .maybeSingle(),
    ]);

    let seedCount: number | null = null;
    let seedPreview: PhaseLockSeedBranch[] = [];

    if (phase.slug === "june_area") {
      const { data: advanced } = await service
        .from("published_standings")
        .select("branch_id, region_filter, rank, branches(branch_code, branch_name, region)")
        .eq("season_id", season.id)
        .eq("status", "advanced")
        .order("region_filter")
        .order("rank");

      seedCount = advanced?.length ?? 0;
      seedPreview = (advanced ?? []).map((row) => {
        const branch = Array.isArray(row.branches) ? row.branches[0] : row.branches;
        return {
          branch_name: branch?.branch_name ?? "Unknown",
          branch_code: branch?.branch_code ?? "",
          region: (row.region_filter as Region | null) ?? branch?.region ?? null,
        };
      });
    } else {
      const { data: winners } = await service
        .from("published_standings")
        .select(
          "branch_id, region_filter, branches(branch_code, branch_name, region)"
        )
        .eq("season_id", season.id)
        .eq("rank", 1)
        .not("region_filter", "is", null)
        .order("region_filter");

      seedCount = winners?.length ?? 0;
      seedPreview = (winners ?? []).map((row) => {
        const branch = Array.isArray(row.branches) ? row.branches[0] : row.branches;
        return {
          branch_name: branch?.branch_name ?? "Unknown",
          branch_code: branch?.branch_code ?? "",
          region: (row.region_filter as Region | null) ?? branch?.region ?? null,
        };
      });
    }

    result.push({
      seasonSlug: phase.slug,
      name: season.name,
      description: phase.description,
      lockedAt: lock?.locked_at ?? null,
      lockedByEmail: lock?.locked_by_email ?? null,
      round3Published: r3?.status === "published",
      round3Round: r3
        ? { id: r3.id, name: r3.name, status: r3.status }
        : null,
      seedCount,
      seedPreview,
    });
  }

  return result;
}
