import { createServiceClient } from "@/lib/supabase/server";
import { BRANCH_WITH_REPS_SELECT } from "@/lib/representative-fields";
import type { Branch } from "@/lib/types";
import {
  buildAreaBrackets,
  type SdGroupSortMode,
} from "./area-groups";
import type {
  SdAreaBracket,
  SdAreaGroupBranch,
  SdEvent,
  SdSet,
  SdSetScore,
  SdSetType,
} from "./types";
import { SD_SET_ORDER } from "./types";

export async function getSdEvent(): Promise<SdEvent | null> {
  const service = await createServiceClient();
  const { data, error } = await service
    .from("sd_events")
    .select("id, slug, name")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  let group_sort_mode: SdGroupSortMode = "branch_code";
  const { data: modeRow, error: modeError } = await service
    .from("sd_events")
    .select("group_sort_mode")
    .eq("id", data.id)
    .maybeSingle();

  if (!modeError && modeRow?.group_sort_mode) {
    group_sort_mode = modeRow.group_sort_mode as SdGroupSortMode;
  }

  return {
    ...data,
    group_sort_mode,
  } as SdEvent;
}

export async function getAllBranches(): Promise<Branch[]> {
  const service = await createServiceClient();
  const activeQuery = await service
    .from("branches")
    .select(BRANCH_WITH_REPS_SELECT)
    .eq("is_active", true)
    .order("area")
    .order("branch_code");

  if (activeQuery.error?.code === "42703") {
    const fallback = await service
      .from("branches")
      .select(BRANCH_WITH_REPS_SELECT)
      .order("area")
      .order("branch_code");
    return (fallback.data ?? []) as Branch[];
  }

  return (activeQuery.data ?? []) as Branch[];
}

interface AreaGroupRow {
  area: string;
  branch_id: string;
  group_label: string;
  sort_order: number;
}

async function loadPersistedAreaBrackets(
  eventId: string,
  branches: Branch[]
): Promise<SdAreaBracket[] | null> {
  const service = await createServiceClient();
  const { data: groupRows } = await service
    .from("sd_area_groups")
    .select("area, branch_id, group_label, sort_order")
    .eq("event_id", eventId);

  if (!groupRows?.length) return null;

  const branchById = new Map(branches.map((b) => [b.id, b]));
  const byArea = new Map<string, AreaGroupRow[]>();

  for (const row of groupRows as AreaGroupRow[]) {
    if (!byArea.has(row.area)) byArea.set(row.area, []);
    byArea.get(row.area)!.push(row);
  }

  return [...byArea.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([area, rows]) => {
      const sorted = [...rows].sort((a, b) => a.sort_order - b.sort_order);
      const groupA: SdAreaGroupBranch[] = [];
      const groupB: SdAreaGroupBranch[] = [];

      for (const row of sorted) {
        const branch = branchById.get(row.branch_id);
        if (!branch) continue;
        const entry: SdAreaGroupBranch = {
          branch_id: branch.id,
          branch_code: branch.branch_code,
          branch_name: branch.branch_name,
          area: branch.area,
          region: branch.region,
          group_label: row.group_label as "a" | "b",
          sort_order: row.sort_order,
          representative_1: branch.representative_1,
          representative_2: branch.representative_2,
          representative_1_employee_no: branch.representative_1_employee_no,
          representative_1_position: branch.representative_1_position,
          representative_2_employee_no: branch.representative_2_employee_no,
          representative_2_position: branch.representative_2_position,
        };
        if (row.group_label === "a") groupA.push(entry);
        else groupB.push(entry);
      }

      const region = groupA[0]?.region ?? groupB[0]?.region ?? "luzon";
      return {
        area,
        region,
        groupA,
        groupB,
        branchCount: groupA.length + groupB.length,
      };
    });
}

export async function getSdAreaBrackets(eventId: string): Promise<SdAreaBracket[]> {
  const [event, branches] = await Promise.all([
    getSdEvent(),
    getAllBranches(),
  ]);
  const persisted = await loadPersistedAreaBrackets(eventId, branches);
  if (persisted?.length) return persisted;

  const mode = event?.group_sort_mode ?? "branch_code";
  return buildAreaBrackets(branches, mode);
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
    .select(
      "branch_id, points, hearts_remaining, is_eliminated, active_representative, set_id"
    )
    .in("set_id", setIds);

  return (data ?? []).map((row) => ({
    branch_id: row.branch_id,
    points: Number(row.points),
    hearts_remaining: row.hearts_remaining,
    is_eliminated: row.is_eliminated,
    active_representative: (row.active_representative === 2 ? 2 : 1) as 1 | 2,
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
      active_representative: row.active_representative ?? 1,
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
      areaChampionName: champ
        ? champ.representative_1?.trim() || champ.branch_name
        : null,
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
    .select("branch_id, points, hearts_remaining, is_eliminated, active_representative")
    .eq("set_id", setId);

  return {
    set: set as SdSet,
    scores: (scores ?? []).map((s) => ({
      branch_id: s.branch_id,
      points: Number(s.points),
      hearts_remaining: s.hearts_remaining,
      is_eliminated: s.is_eliminated,
      active_representative: (s.active_representative === 2 ? 2 : 1) as 1 | 2,
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
