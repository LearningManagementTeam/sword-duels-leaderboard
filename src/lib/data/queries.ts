import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Region, SeasonSlug } from "@/lib/scoring-config";
import type {
  AuditEntry,
  Branch,
  Round,
  Season,
  StandingRow,
} from "@/lib/types";

export async function getSeasons(): Promise<Season[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seasons")
    .select("id, slug, name, advancement_count")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as Season[];
}

export async function getSeasonBySlug(slug: SeasonSlug): Promise<Season | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seasons")
    .select("id, slug, name, advancement_count")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data as Season | null;
}

export async function getBranches(): Promise<Branch[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("branches")
    .select("id, branch_code, branch_name, area, region")
    .order("branch_name");
  if (error) throw error;
  return (data ?? []) as Branch[];
}

export async function getSeasonParticipants(
  seasonId: string
): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("season_participants")
    .select("branch_id")
    .eq("season_id", seasonId);
  if (error) throw error;
  return (data ?? []).map((r) => r.branch_id);
}

export async function getPublishedStandings(
  seasonId: string,
  regionFilter?: Region
): Promise<StandingRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  let query = supabase
    .from("published_standings")
    .select(
      `
      rank,
      total_points,
      round1_points,
      round2_points,
      round3_points,
      total_wins,
      status,
      eliminated_in_round,
      tie_breaker_in_round,
      last_active_round,
      branch:branches (
        id,
        branch_code,
        branch_name,
        area,
        region,
        representative_1,
        representative_2
      )
    `
    )
    .eq("season_id", seasonId)
    .order("rank");

  if (regionFilter) {
    query = query.eq("region_filter", regionFilter);
  } else {
    query = query.is("region_filter", null);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => {
    const b = row.branch as unknown as Branch;
    const lastActive = row.last_active_round ?? 3;
    const mapRound = (n: number, val: number) =>
      lastActive >= n ? Number(val) : null;
    const advancing_to_round =
      row.eliminated_in_round === null &&
      (row.tie_breaker_in_round ?? null) === null &&
      lastActive > 0 &&
      lastActive < 3 &&
      row.status === "active"
        ? lastActive + 1
        : null;
    return {
      branch_id: b.id,
      branch_code: b.branch_code,
      branch_name: b.branch_name,
      area: b.area,
      region: b.region,
      rank: row.rank,
      total_points: Number(row.total_points),
      round1_points: mapRound(1, row.round1_points),
      round2_points: mapRound(2, row.round2_points),
      round3_points: mapRound(3, row.round3_points),
      total_wins: row.total_wins,
      status: row.status,
      representative_1: b.representative_1 ?? null,
      representative_2: b.representative_2 ?? null,
      eliminated_in_round: row.eliminated_in_round ?? null,
      tie_breaker_in_round: row.tie_breaker_in_round ?? null,
      last_active_round: row.last_active_round ?? null,
      advancing_to_round,
    };
  });
}

export async function getLatestPublishedRoundNumber(
  seasonId: string
): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rounds")
    .select("round_number")
    .eq("season_id", seasonId)
    .eq("status", "published")
    .order("round_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.round_number ?? 0;
}

export async function getLastPublishedAt(
  seasonId: string
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("published_standings")
    .select("published_at")
    .eq("season_id", seasonId)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.published_at ?? null;
}

export async function getRoundsForSeason(seasonId: string): Promise<Round[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rounds")
    .select("id, season_id, round_number, name, status, published_at")
    .eq("season_id", seasonId)
    .order("round_number");
  if (error) throw error;
  return (data ?? []) as Round[];
}

export async function getAuditLog(limit = 50): Promise<AuditEntry[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as AuditEntry[];
}

export async function isPhaseLocked(seasonId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("phase_locks")
    .select("id")
    .eq("season_id", seasonId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}
