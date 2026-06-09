import { enrichBranchesWithRepEmployees } from "@/lib/employees";
import { createServiceClient } from "@/lib/supabase/server";
import { BRANCH_WITH_REPS_SELECT } from "@/lib/representative-fields";
import type { Region } from "@/lib/scoring-config";
import { REGIONS } from "@/lib/scoring-config";
import type { Branch } from "@/lib/types";
import { loadNationalsRoster } from "./nationals-wildcard-data";
import {
  SD_REGIONAL_SET_ORDER,
  regionalAreaReps,
} from "./regional-rounds";
import { isAreaSetType } from "./format-guards";
import { normalizeSdTournamentFormat } from "./tournament-format";
import {
  buildAreaBrackets,
  type SdGroupSortMode,
} from "./area-groups";
import type {
  SdAreaBracket,
  SdAreaGroupBranch,
  SdAreaSet,
  SdEvent,
  SdSet,
  SdSetScore,
  SdAreaSetType,
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
  let tournament_format = normalizeSdTournamentFormat("classic_v1");
  const { data: modeRow, error: modeError } = await service
    .from("sd_events")
    .select("group_sort_mode, tournament_format")
    .eq("id", data.id)
    .maybeSingle();

  if (!modeError && modeRow) {
    if (modeRow.group_sort_mode) {
      group_sort_mode = modeRow.group_sort_mode as SdGroupSortMode;
    }
    tournament_format = normalizeSdTournamentFormat(
      modeRow.tournament_format as string | null
    );
  }

  return {
    ...data,
    group_sort_mode,
    tournament_format,
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
    return enrichBranchesWithRepEmployees((fallback.data ?? []) as Branch[]);
  }

  return enrichBranchesWithRepEmployees((activeQuery.data ?? []) as Branch[]);
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
          representative_1_employee_id: branch.representative_1_employee_id,
          representative_2_employee_id: branch.representative_2_employee_id,
          representative_1_employment_status: branch.representative_1_employment_status,
          representative_2_employment_status: branch.representative_2_employment_status,
          representative_1_photo_path: branch.representative_1_photo_path,
          representative_2_photo_path: branch.representative_2_photo_path,
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
      "branch_id, points, hearts_remaining, is_eliminated, active_representative, active_employee_id, active_employee_photo_path, set_id"
    )
    .in("set_id", setIds);

  const employeeIds = [
    ...new Set(
      (data ?? [])
        .map((row) => row.active_employee_id as string | null)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const { loadEmployeesByIds } = await import("@/lib/employees");
  const employeesById = await loadEmployeesByIds(employeeIds);

  return (data ?? []).map((row) => {
    const employee = row.active_employee_id
      ? employeesById.get(row.active_employee_id as string)
      : null;
    return {
      branch_id: row.branch_id,
      points: Number(row.points),
      hearts_remaining: row.hearts_remaining,
      is_eliminated: row.is_eliminated,
      active_representative: (row.active_representative === 2 ? 2 : 1) as 1 | 2,
      active_employee_id: (row.active_employee_id as string | null) ?? null,
      active_employee_name: employee?.full_name ?? null,
      active_employee_no: employee?.employee_no ?? null,
      active_employee_position: employee?.position ?? null,
      active_employee_status: employee?.employment_status ?? null,
      active_employee_photo_path:
        (row.active_employee_photo_path as string | null) ??
        employee?.photo_path ??
        null,
      set_id: row.set_id as string,
    };
  }) as (SdSetScore & { set_id: string })[];
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

  let sets: SdAreaSet[] = (await getSdSetsForArea(eventId, area)).filter(
    (s): s is SdAreaSet => isAreaSetType(s.set_type)
  );
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

export async function getSdRegionalContext(eventId: string, region: Region) {
  const [roster, allSets] = await Promise.all([
    loadNationalsRoster(eventId),
    getSdSetsForEvent(eventId),
  ]);
  const regionalSetIds = allSets
    .filter((s) => s.area === region && s.set_type.startsWith("regional_"))
    .map((s) => s.id);
  const scoreRows = await getSdSetScores(regionalSetIds);
  const sets = allSets;

  const regionalSets = SD_REGIONAL_SET_ORDER.map((setType) => {
    const existing = sets.find(
      (s) => s.area === region && s.set_type === setType
    );
    return (
      existing ?? {
        id: "",
        event_id: eventId,
        area: region,
        set_type: setType,
        scoring_mode: "high_score" as const,
        status: "draft" as const,
        winner_branch_id: null,
        published_at: null,
      }
    );
  });

  const scoreMap = scoresBySetId(scoreRows);
  const participants = regionalAreaReps(roster.areaReps, region);

  return {
    region,
    roster,
    sets: regionalSets,
    allSets: sets,
    scoreMap,
    participants,
    allAreaFinalsPublished: roster.allAreaFinalsPublished,
  };
}

export function participantsForSetType(
  bracket: SdAreaBracket,
  setType: SdAreaSetType,
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
