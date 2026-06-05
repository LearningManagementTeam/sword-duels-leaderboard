import { createServiceClient } from "@/lib/supabase/server";
import type { Branch } from "@/lib/types";
import { buildAreaBrackets } from "./area-groups";
import type {
  SdAreaBracket,
  SdEvent,
  SdSet,
  SdSetScore,
  SdSetType,
} from "./types";
import { SD_SET_ORDER } from "./types";

export async function getSdEvent(): Promise<SdEvent | null> {
  const service = await createServiceClient();
  const { data } = await service
    .from("sd_events")
    .select("id, slug, name")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data as SdEvent | null;
}

export async function getAllBranches(): Promise<Branch[]> {
  const service = await createServiceClient();
  const { data } = await service
    .from("branches")
    .select(
      "id, branch_code, branch_name, area, region, representative_1, representative_2"
    )
    .order("area")
    .order("branch_code");
  return (data ?? []) as Branch[];
}

export async function getSdAreaBrackets(eventId: string): Promise<SdAreaBracket[]> {
  const branches = await getAllBranches();
  return buildAreaBrackets(branches);
}

export async function getSdSetsForEvent(eventId: string): Promise<SdSet[]> {
  const service = await createServiceClient();
  const { data } = await service
    .from("sd_sets")
    .select(
      "id, event_id, area, set_type, scoring_mode, status, winner_branch_id, published_at"
    )
    .eq("event_id", eventId);
  return (data ?? []) as SdSet[];
}

export async function getSdSetsForArea(
  eventId: string,
  area: string
): Promise<SdSet[]> {
  const service = await createServiceClient();
  const { data } = await service
    .from("sd_sets")
    .select(
      "id, event_id, area, set_type, scoring_mode, status, winner_branch_id, published_at"
    )
    .eq("event_id", eventId)
    .eq("area", area);
  return (data ?? []) as SdSet[];
}

export async function getSdSetScores(setIds: string[]): Promise<SdSetScore[]> {
  if (setIds.length === 0) return [];
  const service = await createServiceClient();
  const { data } = await service
    .from("sd_set_scores")
    .select("branch_id, points, hearts_remaining, is_eliminated, set_id")
    .in("set_id", setIds);

  return (data ?? []).map((row) => ({
    branch_id: row.branch_id,
    points: Number(row.points),
    hearts_remaining: row.hearts_remaining,
    is_eliminated: row.is_eliminated,
    set_id: row.set_id as string,
  })) as (SdSetScore & { set_id: string })[];
}

export function scoresBySetId(
  rows: (SdSetScore & { set_id?: string })[]
): Map<string, SdSetScore[]> {
  const map = new Map<string, SdSetScore[]>();
  for (const row of rows) {
    const setId = row.set_id;
    if (!setId) continue;
    const list = map.get(setId) ?? [];
    list.push({
      branch_id: row.branch_id,
      points: row.points,
      hearts_remaining: row.hearts_remaining,
      is_eliminated: row.is_eliminated,
    });
    map.set(setId, list);
  }
  return map;
}

export async function getSdAreaContext(eventId: string, area: string) {
  const brackets = await getSdAreaBrackets(eventId);
  const bracket = brackets.find((b) => b.area === area);
  if (!bracket) return null;

  let sets = await getSdSetsForArea(eventId, area);
  const existingTypes = new Set(sets.map((s) => s.set_type));
  for (const setType of SD_SET_ORDER) {
    if (!existingTypes.has(setType)) {
      sets.push({
        id: "",
        event_id: eventId,
        area,
        set_type: setType,
        scoring_mode: "high_score",
        status: "draft",
        winner_branch_id: null,
        published_at: null,
      });
    }
  }
  sets = sets.sort(
    (a, b) =>
      SD_SET_ORDER.indexOf(a.set_type) - SD_SET_ORDER.indexOf(b.set_type)
  );

  const setIds = sets.filter((s) => s.id).map((s) => s.id);
  const scoreRows = await getSdSetScores(setIds);
  const scoreMap = scoresBySetId(scoreRows);

  return { bracket, sets, scoreMap };
}

export interface SdDashboardArea {
  area: string;
  region: string;
  branchCount: number;
  groupACount: number;
  groupBCount: number;
  groupAPublished: boolean;
  groupBPublished: boolean;
  finalPublished: boolean;
  areaChampionName: string | null;
}

export async function getSdDashboard(eventId: string): Promise<{
  event: SdEvent;
  areas: SdDashboardArea[];
}> {
  const event = await getSdEvent();
  if (!event) throw new Error("Sword Duels event not configured");

  const brackets = await getSdAreaBrackets(eventId);
  const sets = await getSdSetsForEvent(eventId);
  const branches = await getAllBranches();
  const branchById = new Map(branches.map((b) => [b.id, b]));

  const areas: SdDashboardArea[] = brackets.map((b) => {
    const areaSets = sets.filter((s) => s.area === b.area);
    const ga = areaSets.find((s) => s.set_type === "group_a");
    const gb = areaSets.find((s) => s.set_type === "group_b");
    const fin = areaSets.find((s) => s.set_type === "area_final");
    const champId = fin?.winner_branch_id;
    const champ = champId ? branchById.get(champId) : null;

    return {
      area: b.area,
      region: b.region,
      branchCount: b.branchCount,
      groupACount: b.groupA.length,
      groupBCount: b.groupB.length,
      groupAPublished: ga?.status === "published",
      groupBPublished: gb?.status === "published",
      finalPublished: fin?.status === "published",
      areaChampionName: champ?.branch_name ?? null,
    };
  });

  return { event, areas };
}

export async function getSdSetWithScores(setId: string) {
  const service = await createServiceClient();
  const { data: set } = await service
    .from("sd_sets")
    .select(
      "id, event_id, area, set_type, scoring_mode, status, winner_branch_id, published_at"
    )
    .eq("id", setId)
    .single();
  if (!set) return null;

  const { data: scores } = await service
    .from("sd_set_scores")
    .select("branch_id, points, hearts_remaining, is_eliminated")
    .eq("set_id", setId);

  return {
    set: set as SdSet,
    scores: (scores ?? []).map((s) => ({
      branch_id: s.branch_id,
      points: Number(s.points),
      hearts_remaining: s.hearts_remaining,
      is_eliminated: s.is_eliminated,
    })) as SdSetScore[],
  };
}

export function participantsForSetType(
  bracket: SdAreaBracket,
  setType: SdSetType,
  sets: SdSet[]
): SdAreaBracket["groupA"] {
  if (setType === "group_a") return bracket.groupA;
  if (setType === "group_b") return bracket.groupB;
  const ga = sets.find((s) => s.set_type === "group_a");
  const gb = sets.find((s) => s.set_type === "group_b");
  const pool = [...bracket.groupA, ...bracket.groupB];
  return pool.filter(
    (b) =>
      b.branch_id === ga?.winner_branch_id ||
      b.branch_id === gb?.winner_branch_id
  );
}
