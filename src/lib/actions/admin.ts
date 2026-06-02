"use server";

import { revalidatePath } from "next/cache";
import { readFile } from "fs/promises";
import { join } from "path";
import { parseBranchesCsv } from "@/lib/branches-csv";
import {
  aggregatePublishedResults,
  computeStandings,
} from "@/lib/scoring";
import type { Region, SeasonSlug } from "@/lib/scoring-config";
import { SCORING_CONFIG, REGIONS } from "@/lib/scoring-config";
import {
  createClient,
  createServiceClient,
  isSupabaseConfigured,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/server";

async function requireAdmin() {
  if (!isSupabaseServiceConfigured()) {
    throw new Error("Supabase is not configured");
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("Not authenticated");

  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) throw new Error("Not authorized");
  return { supabase, user, email: user.email };
}

async function logAudit(
  email: string,
  action: string,
  entity_type: string,
  entity_id: string | null,
  details: Record<string, unknown>
) {
  const service = await createServiceClient();
  await service.from("audit_log").insert({
    admin_email: email,
    action,
    entity_type,
    entity_id,
    details,
  });
}

export async function importBranchesFromCsv(csvText?: string) {
  const { email } = await requireAdmin();
  const text =
    csvText ??
    (await readFile(
      join(process.cwd(), "data", "branches.csv"),
      "utf-8"
    ));

  const { rows, errors } = parseBranchesCsv(text);
  if (errors.length) return { ok: false as const, errors };
  if (rows.length < 130) {
    return {
      ok: false as const,
      errors: [`Expected at least 130 branches, got ${rows.length}`],
    };
  }

  const service = await createServiceClient();
  const { error } = await service.from("branches").upsert(
    rows.map((r) => ({
      branch_code: r.branch_code,
      branch_name: r.branch_name,
      area: r.area,
      region: r.region,
    })),
    { onConflict: "branch_code" }
  );

  if (error) return { ok: false as const, errors: [error.message] };

  await logAudit(email, "import_branches", "branches", null, {
    count: rows.length,
  });
  revalidatePath("/", "layout");
  return { ok: true as const, count: rows.length };
}

/** June Area-wide: import participating branches + seed Round 1 entry rows. */
export async function importParticipatingBranchesForJuneArea(csvText: string) {
  const { email } = await requireAdmin();

  if (!csvText?.trim()) {
    return { ok: false as const, errors: ["CSV file is empty."] };
  }

  const { rows, errors } = parseBranchesCsv(csvText);
  if (errors.length) return { ok: false as const, errors };
  if (rows.length < 130) {
    return {
      ok: false as const,
      errors: [
        `June Area-wide needs at least 130 participating branches. Your file has ${rows.length}.`,
      ],
    };
  }

  const service = await createServiceClient();
  const { error: branchError } = await service.from("branches").upsert(
    rows.map((r) => ({
      branch_code: r.branch_code,
      branch_name: r.branch_name,
      area: r.area,
      region: r.region,
    })),
    { onConflict: "branch_code" }
  );
  if (branchError) {
    return { ok: false as const, errors: [branchError.message] };
  }

  const { data: season } = await service
    .from("seasons")
    .select("id")
    .eq("slug", "june_area")
    .single();
  if (!season) {
    return { ok: false as const, errors: ["June season not found in database."] };
  }

  const { data: round } = await service
    .from("rounds")
    .select("id")
    .eq("season_id", season.id)
    .eq("round_number", 1)
    .single();
  if (!round) {
    return { ok: false as const, errors: ["June Round 1 not found in database."] };
  }

  const { data: branches } = await service.from("branches").select("id");
  const branchIds = (branches ?? []).map((b) => b.id);

  if (branchIds.length > 0) {
    const { error: seedError } = await service.from("round_results").upsert(
      branchIds.map((branch_id) => ({
        round_id: round.id,
        branch_id,
        points: 0,
        wins: 0,
        losses: 0,
      })),
      { onConflict: "round_id,branch_id" }
    );
    if (seedError) {
      return { ok: false as const, errors: [seedError.message] };
    }
  }

  await logAudit(email, "import_june_participants", "june_area", season.id, {
    branch_count: rows.length,
    round_id: round.id,
    round_seeded: true,
  });

  revalidatePath("/", "layout");
  return {
    ok: true as const,
    count: rows.length,
    roundId: round.id,
    message: `Imported ${rows.length} branches and prepared June Round 1 for data entry.`,
  };
}

export async function saveRoundResults(
  roundId: string,
  results: Array<{
    branch_id: string;
    points: number;
    wins: number;
    losses: number;
  }>
) {
  const { email } = await requireAdmin();
  const service = await createServiceClient();

  const payload = results.map((r) => ({
    round_id: roundId,
    branch_id: r.branch_id,
    points: r.points,
    wins: r.wins,
    losses: r.losses,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await service.from("round_results").upsert(payload, {
    onConflict: "round_id,branch_id",
  });
  if (error) throw new Error(error.message);

  await logAudit(email, "save_round_results", "round", roundId, {
    count: results.length,
  });
  revalidatePath("/admin");
  return { ok: true };
}

export async function publishRound(roundId: string) {
  const { email } = await requireAdmin();
  const service = await createServiceClient();

  const { data: round, error: roundErr } = await service
    .from("rounds")
    .select("id, season_id, round_number, seasons(slug)")
    .eq("id", roundId)
    .single();
  if (roundErr || !round) throw new Error("Round not found");

  const seasonRaw = round.seasons as { slug: SeasonSlug } | { slug: SeasonSlug }[];
  const seasonSlug = (Array.isArray(seasonRaw) ? seasonRaw[0] : seasonRaw).slug;

  await service
    .from("rounds")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", roundId);

  await recomputeAndPublishStandings(service, seasonSlug, round.season_id);

  await logAudit(email, "publish_round", "round", roundId, { seasonSlug });
  revalidatePath("/", "layout");
  return { ok: true };
}

async function recomputeAndPublishStandings(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  seasonSlug: SeasonSlug,
  seasonId: string
) {
  const participantIds = await getParticipantBranchIds(
    service,
    seasonId,
    seasonSlug
  );

  let branchQuery = service
    .from("branches")
    .select("id, branch_code, branch_name, area, region");
  if (participantIds.length > 0) {
    branchQuery = branchQuery.in("id", participantIds);
  }
  const { data: branchList } = await branchQuery;

  const { data: publishedRounds } = await service
    .from("rounds")
    .select("id, round_number")
    .eq("season_id", seasonId)
    .eq("status", "published");

  const roundIds = (publishedRounds ?? []).map((r) => r.id);
  const { data: results } = await service
    .from("round_results")
    .select("branch_id, points, wins, losses, rounds(round_number)")
    .in("round_id", roundIds.length ? roundIds : ["00000000-0000-0000-0000-000000000000"]);

  const mapped = (results ?? []).map((r) => ({
    branch_id: r.branch_id,
    points: Number(r.points),
    wins: r.wins,
    losses: r.losses,
    round_number: (Array.isArray(r.rounds) ? r.rounds[0] : r.rounds)
      .round_number,
  }));

  const agg = aggregatePublishedResults(mapped);
  const publishedAt = new Date().toISOString();

  if (seasonSlug === "july_region") {
    await service
      .from("published_standings")
      .delete()
      .eq("season_id", seasonId);

    for (const region of REGIONS) {
      const standings = computeStandings(
        seasonSlug,
        branchList ?? [],
        agg,
        { filterRegion: region }
      );
      await upsertStandings(service, seasonId, standings, publishedAt, region);
    }
  } else {
    await service
      .from("published_standings")
      .delete()
      .eq("season_id", seasonId)
      .is("region_filter", null);

    const standings = computeStandings(seasonSlug, branchList ?? [], agg);
    await upsertStandings(service, seasonId, standings, publishedAt, null);
  }
}

async function upsertStandings(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  seasonId: string,
  standings: ReturnType<typeof computeStandings>,
  publishedAt: string,
  region: Region | null
) {
  if (!standings.length) return;
  const rows = standings.map((s) => ({
    season_id: seasonId,
    branch_id: s.branch_id,
    rank: s.rank,
    total_points: s.total_points,
    round1_points: s.round1_points,
    round2_points: s.round2_points,
    round3_points: s.round3_points,
    total_wins: s.total_wins,
    status: s.status,
    region_filter: region,
    published_at: publishedAt,
  }));
  const { error } = await service.from("published_standings").insert(rows);
  if (error) throw new Error(error.message);
}

async function getParticipantBranchIds(
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

export async function lockPhaseAndAdvance(seasonSlug: SeasonSlug) {
  const { email } = await requireAdmin();
  const service = await createServiceClient();

  const { data: season } = await service
    .from("seasons")
    .select("id, slug")
    .eq("slug", seasonSlug)
    .single();
  if (!season) throw new Error("Season not found");

  await service.from("phase_locks").upsert({
    season_id: season.id,
    locked_by_email: email,
  });

  if (seasonSlug === "june_area") {
    const { data: top } = await service
      .from("published_standings")
      .select("branch_id")
      .eq("season_id", season.id)
      .is("region_filter", null)
      .lte("rank", SCORING_CONFIG.june_area.advancementCount);

    const july = await service
      .from("seasons")
      .select("id")
      .eq("slug", "july_region")
      .single();

    if (july.data) {
      await service
        .from("season_participants")
        .delete()
        .eq("season_id", july.data.id);
      await service.from("season_participants").insert(
        (top ?? []).map((t) => ({
          season_id: july.data.id,
          branch_id: t.branch_id,
          seeded_from_season_id: season.id,
        }))
      );
    }
  } else if (seasonSlug === "july_region") {
    const august = await service
      .from("seasons")
      .select("id")
      .eq("slug", "august_finals")
      .single();

    if (august.data) {
      await service
        .from("season_participants")
        .delete()
        .eq("season_id", august.data.id);

      const champions: string[] = [];
      for (const region of REGIONS) {
        const { data: winner } = await service
          .from("published_standings")
          .select("branch_id")
          .eq("season_id", season.id)
          .eq("region_filter", region)
          .eq("rank", 1)
          .maybeSingle();
        if (winner) champions.push(winner.branch_id);
      }

      if (champions.length) {
        await service.from("season_participants").insert(
          champions.map((branch_id) => ({
            season_id: august.data.id,
            branch_id,
            seeded_from_season_id: season.id,
          }))
        );
      }
    }
  }

  await logAudit(email, "lock_phase", "season", season.id, { seasonSlug });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}
