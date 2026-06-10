"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { SWORD_DUELS_ADMIN, SWORD_DUELS_PUBLIC, swordDuelsPath } from "@/lib/admin-routes";
import { requireAdminEmail } from "@/lib/admin-auth";
import {
  areaSlug,
  buildAreaBrackets,
  isManualAreaGroup,
  parseManualAreaGroups,
  splitAreaIntoGroups,
  validateAreaGroupAssignment,
} from "@/lib/products/sword-duels/area-groups";
import type { SdGroupSortMode } from "@/lib/products/sword-duels/area-groups";
import {
  getSdAreaBranches,
  getSdAreaContext,
  getSdEvent,
  participantsForSetType,
} from "@/lib/products/sword-duels/queries";
import { computeSetResults } from "@/lib/products/sword-duels/scoring";
import {
  isRegionalSetType,
  priorRegionalSetType,
} from "@/lib/products/sword-duels/format-guards";
import { sdEventHasPublishedScores } from "@/lib/products/sword-duels/format-guards";
import { ensureRegionalSetsForEvent } from "@/lib/products/sword-duels/regional-rounds";
import {
  isRegionalAverageFormat,
  type SdTournamentFormat,
} from "@/lib/products/sword-duels/tournament-format";
import { trySyncV2KnockoutBracket } from "@/lib/products/sword-duels/v2-knockout-sync";
import type { SdAreaSetType, SdScoringMode, SdSetType } from "@/lib/products/sword-duels/types";
import { SD_SET_ORDER } from "@/lib/products/sword-duels/types";
import {
  publishWildcardRound,
  syncWildcardRound,
  unpublishWildcardRound,
} from "@/lib/products/sword-duels/wildcard-sync";
import {
  publishKnockoutMatch,
  saveKnockoutMatchScores,
  syncKnockoutBracket,
  trySyncKnockoutBracket,
  unpublishKnockoutMatch,
} from "@/lib/products/sword-duels/knockout-sync";
import { getSdNationalsContext } from "@/lib/products/sword-duels/nationals-queries";
import {
  parseRepresentativesCsv,
  representativeCsvRowToPayload,
} from "@/lib/representatives-csv";
import { createServiceClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const email = await requireAdminEmail();
  return { email };
}

async function logAudit(
  email: string,
  action: string,
  entity_id: string | null,
  details: Record<string, unknown>
) {
  try {
    const service = await createServiceClient();
    await service.from("audit_log").insert({
      admin_email: email,
      action,
      entity_type: "sword_duels",
      entity_id,
      details,
    });
  } catch {
    /* non-fatal */
  }
}

/** Defer cache revalidation so score actions do not 500 when a stale page render fails. */
function scheduleSdRevalidation(options?: {
  area?: string;
  brackets?: boolean;
  home?: boolean;
}) {
  after(() => {
    try {
      revalidatePath(SWORD_DUELS_ADMIN);
      revalidatePath(swordDuelsPath("representatives"));
      revalidatePath(swordDuelsPath("areas"));
      revalidatePath(swordDuelsPath("nationals"));
      revalidatePath(SWORD_DUELS_PUBLIC);
      revalidatePath(`${SWORD_DUELS_PUBLIC}/calendar`);
      revalidatePath(`${SWORD_DUELS_PUBLIC}/nationals`);
      revalidatePath(`${SWORD_DUELS_PUBLIC}/regionals`);
      revalidatePath(swordDuelsPath("regionals"));
      if (options?.area) {
        const slug = areaSlug(options.area);
        revalidatePath(`${SWORD_DUELS_PUBLIC}/${slug}`);
        revalidatePath(swordDuelsPath("areas", slug));
      }
      if (options?.brackets) {
        revalidatePath(swordDuelsPath("brackets"));
      }
      if (options?.home) {
        revalidatePath("/");
        revalidatePath(swordDuelsPath("schedules"));
        revalidatePath(swordDuelsPath("calendar"));
      }
    } catch {
      /* non-fatal */
    }
  });
}

function scheduleSdNationalsRevalidation() {
  after(() => {
    try {
      revalidatePath(SWORD_DUELS_ADMIN);
      revalidatePath(swordDuelsPath("nationals"));
      revalidatePath(swordDuelsPath("regionals"));
      revalidatePath(`${SWORD_DUELS_PUBLIC}/nationals`);
      revalidatePath(`${SWORD_DUELS_PUBLIC}/regionals`);
    } catch {
      /* non-fatal */
    }
  });
}

export type SdActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function syncSdBracketsForm(sortMode: SdGroupSortMode): Promise<void> {
  await syncSdBrackets(sortMode);
}

export async function syncSdBrackets(
  explicitMode?: SdGroupSortMode
): Promise<{ areaCount: number; group_sort_mode: SdGroupSortMode }> {
  const { email } = await requireAdmin();
  const service = await createServiceClient();
  const event = await getSdEvent();
  if (!event) throw new Error("Sword Duels event not found");

  const sortMode = explicitMode ?? event.group_sort_mode ?? "branch_code";

  if (explicitMode) {
    const { error: modeError } = await service
      .from("sd_events")
      .update({ group_sort_mode: explicitMode })
      .eq("id", event.id);
    if (modeError) throw new Error(modeError.message);
  }

  const { data: branches } = await service
    .from("branches")
    .select("id, branch_code, branch_name, area, region")
    .eq("is_active", true);
  const brackets = buildAreaBrackets(
    (branches ?? []) as Parameters<typeof buildAreaBrackets>[0],
    sortMode
  );

  const { data: eventMeta } = await service
    .from("sd_events")
    .select("manual_area_groups")
    .eq("id", event.id)
    .maybeSingle();

  const manualAreas = parseManualAreaGroups(eventMeta?.manual_area_groups);
  let syncedBranchCount = 0;

  for (const b of brackets) {
    if (isManualAreaGroup(manualAreas, b.area)) continue;

    const { error: delError } = await service
      .from("sd_area_groups")
      .delete()
      .eq("event_id", event.id)
      .eq("area", b.area);
    if (delError) throw new Error(delError.message);

    const rows = [...b.groupA, ...b.groupB].map((g) => ({
      event_id: event.id,
      area: b.area,
      branch_id: g.branch_id,
      group_label: g.group_label,
      sort_order: g.sort_order,
    }));

    if (rows.length > 0) {
      const { error } = await service.from("sd_area_groups").insert(rows);
      if (error) throw new Error(error.message);
      syncedBranchCount += rows.length;
    }
  }

  for (const b of brackets) {
    for (const setType of SD_SET_ORDER) {
      const { data: existing } = await service
        .from("sd_sets")
        .select("id")
        .eq("event_id", event.id)
        .eq("area", b.area)
        .eq("set_type", setType)
        .maybeSingle();

      if (!existing) {
        await service.from("sd_sets").insert({
          event_id: event.id,
          area: b.area,
          set_type: setType,
          scoring_mode: "high_score",
          status: "draft",
        });
      }
    }
  }

  if (isRegionalAverageFormat(event.tournament_format)) {
    await ensureRegionalSetsForEvent(service, event.id);
  }

  await logAudit(email, "sync_sd_brackets", event.id, {
    areaCount: brackets.length,
    branchCount: syncedBranchCount,
    manualAreaCount: manualAreas.length,
    group_sort_mode: sortMode,
  });
  scheduleSdRevalidation();
  return { areaCount: brackets.length, group_sort_mode: sortMode };
}

function areaGroupBattlesLocked(sets: { set_type: string; status: string }[]): string | null {
  const ga = sets.find((s) => s.set_type === "group_a");
  const gb = sets.find((s) => s.set_type === "group_b");
  if (ga?.status === "published" || gb?.status === "published") {
    return "Group A or Group B is already published — unpublish those sets before changing groups.";
  }
  const fin = sets.find((s) => s.set_type === "area_final");
  if (fin?.status === "published") {
    return "Area final is published — groups cannot be changed.";
  }
  return null;
}

async function persistAreaGroupRows(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  eventId: string,
  area: string,
  groupAIds: string[],
  groupBIds: string[]
) {
  const { error: delError } = await service
    .from("sd_area_groups")
    .delete()
    .eq("event_id", eventId)
    .eq("area", area);
  if (delError) throw new Error(delError.message);

  const rows = [
    ...groupAIds.map((branch_id, i) => ({
      event_id: eventId,
      area,
      branch_id,
      group_label: "a" as const,
      sort_order: i + 1,
    })),
    ...groupBIds.map((branch_id, i) => ({
      event_id: eventId,
      area,
      branch_id,
      group_label: "b" as const,
      sort_order: i + 1,
    })),
  ];

  if (rows.length === 0) return;

  const { error } = await service.from("sd_area_groups").insert(rows);
  if (error) throw new Error(error.message);
}

async function markAreaManualGroups(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  eventId: string,
  area: string,
  manual: boolean
) {
  const { data: row } = await service
    .from("sd_events")
    .select("manual_area_groups")
    .eq("id", eventId)
    .maybeSingle();

  let areas = parseManualAreaGroups(row?.manual_area_groups);
  const key = area.trim();

  if (manual) {
    if (!areas.some((a) => a.trim() === key)) areas = [...areas, key];
  } else {
    areas = areas.filter((a) => a.trim() !== key);
  }

  const { error } = await service
    .from("sd_events")
    .update({ manual_area_groups: areas })
    .eq("id", eventId);

  if (error?.code === "42703") return;
  if (error) throw new Error(error.message);
}

async function clearDraftGroupSetScores(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  eventId: string,
  area: string
) {
  const { data: sets } = await service
    .from("sd_sets")
    .select("id, set_type, status")
    .eq("event_id", eventId)
    .eq("area", area)
    .in("set_type", ["group_a", "group_b"]);

  const setIds = (sets ?? [])
    .filter((s) => s.status !== "published")
    .map((s) => s.id as string);

  if (setIds.length === 0) return;

  await service.from("sd_set_scores").delete().in("set_id", setIds);
  await service
    .from("sd_sets")
    .update({ winner_branch_id: null })
    .in("id", setIds);
}

export async function saveSdAreaGroupAssignment(
  area: string,
  groupAIds: string[],
  groupBIds: string[]
): Promise<SdActionResult & { message?: string }> {
  const { email } = await requireAdmin();
  const event = await getSdEvent();
  if (!event) return { ok: false, error: "Sword Duels event not found." };

  const areaBranches = await getSdAreaBranches(area);
  if (areaBranches.length === 0) {
    return { ok: false, error: "No active branches found for this area." };
  }

  const validationError = validateAreaGroupAssignment(
    areaBranches.map((b) => b.id),
    groupAIds,
    groupBIds
  );
  if (validationError) return { ok: false, error: validationError };

  const ctx = await getSdAreaContext(event.id, area);
  if (!ctx) {
    return {
      ok: false,
      error: "Area brackets not initialized. Sync from branches on the dashboard first.",
    };
  }

  const lockError = areaGroupBattlesLocked(ctx.sets);
  if (lockError) return { ok: false, error: lockError };

  const service = await createServiceClient();

  try {
    await persistAreaGroupRows(service, event.id, area, groupAIds, groupBIds);
    await markAreaManualGroups(service, event.id, area, true);
    await clearDraftGroupSetScores(service, event.id, area);

    for (const setType of ["group_a", "group_b", "area_final"] as const) {
      await ensureSdSet(event.id, area, setType);
    }

    await logAudit(email, "save_sd_area_groups", event.id, {
      area,
      group_a_count: groupAIds.length,
      group_b_count: groupBIds.length,
      manual: true,
    });

    scheduleSdRevalidation({ area, brackets: true });
    return {
      ok: true,
      message: `Saved manual groups for ${area} (${groupAIds.length} in A, ${groupBIds.length} in B).`,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to save group assignment.",
    };
  }
}

export async function resetSdAreaAutoGroups(
  area: string
): Promise<SdActionResult & { message?: string }> {
  const { email } = await requireAdmin();
  const event = await getSdEvent();
  if (!event) return { ok: false, error: "Sword Duels event not found." };

  const areaBranches = await getSdAreaBranches(area);
  if (areaBranches.length === 0) {
    return { ok: false, error: "No active branches found for this area." };
  }

  const ctx = await getSdAreaContext(event.id, area);
  if (ctx) {
    const lockError = areaGroupBattlesLocked(ctx.sets);
    if (lockError) return { ok: false, error: lockError };
  }

  const { groupA, groupB } = splitAreaIntoGroups(
    areaBranches,
    event.group_sort_mode ?? "branch_code"
  );

  const service = await createServiceClient();

  try {
    await persistAreaGroupRows(
      service,
      event.id,
      area,
      groupA.map((b) => b.branch_id),
      groupB.map((b) => b.branch_id)
    );
    await markAreaManualGroups(service, event.id, area, false);
    await clearDraftGroupSetScores(service, event.id, area);

    for (const setType of ["group_a", "group_b", "area_final"] as const) {
      await ensureSdSet(event.id, area, setType);
    }

    await logAudit(email, "reset_sd_area_groups_auto", event.id, {
      area,
      group_sort_mode: event.group_sort_mode,
    });

    scheduleSdRevalidation({ area, brackets: true });
    return {
      ok: true,
      message: `Reset ${area} to automatic split (${groupA.length} / ${groupB.length}).`,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to reset groups.",
    };
  }
}

export async function ensureSdSet(
  eventId: string,
  area: string,
  setType: SdSetType
): Promise<string> {
  const service = await createServiceClient();
  const { data: existing } = await service
    .from("sd_sets")
    .select("id")
    .eq("event_id", eventId)
    .eq("area", area)
    .eq("set_type", setType)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await service
    .from("sd_sets")
    .insert({
      event_id: eventId,
      area,
      set_type: setType,
      scoring_mode: "high_score",
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !created) throw new Error(error?.message ?? "Failed to create set");
  return created.id;
}

export async function updateSdSetScoringMode(
  setId: string,
  scoringMode: SdScoringMode
): Promise<void> {
  await requireAdmin();
  const service = await createServiceClient();

  const { data: set } = await service
    .from("sd_sets")
    .select("status")
    .eq("id", setId)
    .single();
  if (!set) throw new Error("Set not found");
  if (set.status === "published") {
    throw new Error("Cannot change scoring mode on a published set");
  }

  const { error } = await service
    .from("sd_sets")
    .update({ scoring_mode: scoringMode })
    .eq("id", setId);
  if (error) throw new Error(error.message);
  scheduleSdRevalidation();
}

export type SdScoreInput = {
  branch_id: string;
  points: number;
  hearts_remaining?: number | null;
  is_eliminated?: boolean;
  active_representative?: 1 | 2;
};

export async function saveSdSetScores(
  setId: string,
  scores: SdScoreInput[]
): Promise<void> {
  const { email } = await requireAdmin();
  const service = await createServiceClient();

  const { data: set } = await service
    .from("sd_sets")
    .select("id, status, area, event_id, set_type, scoring_mode")
    .eq("id", setId)
    .single();
  if (!set) throw new Error("Set not found");
  if (set.status === "published") {
    throw new Error("Unpublish this set before editing scores");
  }

  const branchIds = [...new Set(scores.map((row) => row.branch_id))];
  const { data: branchRows } = await service
    .from("branches")
    .select(
      "id, representative_1_employee_id, representative_2_employee_id"
    )
    .in("id", branchIds);
  const branchById = new Map((branchRows ?? []).map((b) => [b.id, b]));
  const employeeIds = [
    ...new Set(
      scores
        .map((row) => {
          const slot = row.active_representative === 2 ? 2 : 1;
          const branch = branchById.get(row.branch_id);
          return slot === 2
            ? branch?.representative_2_employee_id
            : branch?.representative_1_employee_id;
        })
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const { loadEmployeesByIds } = await import("@/lib/employees");
  const employeesById = await loadEmployeesByIds(employeeIds);

  for (const row of scores) {
    const slot = row.active_representative === 2 ? 2 : 1;
    const branch = branchById.get(row.branch_id);
    const activeEmployeeId =
      slot === 2
        ? branch?.representative_2_employee_id ?? null
        : branch?.representative_1_employee_id ?? null;
    const employee = activeEmployeeId
      ? employeesById.get(activeEmployeeId)
      : null;

    const { error } = await service.from("sd_set_scores").upsert(
      {
        set_id: setId,
        branch_id: row.branch_id,
        points: row.points,
        hearts_remaining: row.hearts_remaining ?? null,
        is_eliminated: row.is_eliminated ?? false,
        active_representative: slot,
        active_employee_id: activeEmployeeId,
        active_employee_photo_path: employee?.photo_path ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "set_id,branch_id" }
    );
    if (error) throw new Error(error.message);
  }

  await logAudit(email, "save_sd_set_scores", setId, {
    area: set.area,
    set_type: set.set_type,
    count: scores.length,
  });
  scheduleSdRevalidation({ area: set.area });
}

export async function publishSdSet(setId: string): Promise<{ winnerId: string | null }> {
  const { email } = await requireAdmin();
  const service = await createServiceClient();

  const { data: set } = await service
    .from("sd_sets")
    .select("id, event_id, area, set_type, scoring_mode, status")
    .eq("id", setId)
    .single();
  if (!set) throw new Error("Set not found");
  if (set.status === "published") {
    throw new Error("Set is already published");
  }

  if (isRegionalSetType(set.set_type)) {
    return publishRegionalSdSet(setId, set, email);
  }

  const ctx = await getSdAreaContext(set.event_id, set.area);
  if (!ctx) throw new Error("Area not found");

  if (set.set_type === "area_final") {
    const ga = ctx.sets.find((s) => s.set_type === "group_a");
    const gb = ctx.sets.find((s) => s.set_type === "group_b");
    if (ga?.status !== "published" || gb?.status !== "published") {
      throw new Error("Publish Group A and Group B battles before the area final");
    }
    if (!ga.winner_branch_id || !gb.winner_branch_id) {
      throw new Error("Group winners are required before the area final");
    }
  }

  const participants = participantsForSetType(
    ctx.bracket,
    set.set_type as SdAreaSetType,
    ctx.sets
  );

  const scores = ctx.scoreMap.get(setId) ?? [];
  const { winnerId } = computeSetResults(
    participants,
    scores,
    set.scoring_mode as SdScoringMode
  );

  if (!winnerId && set.set_type !== "area_final") {
    throw new Error("Enter scores for at least one branch before publishing");
  }
  if (set.set_type === "area_final" && !winnerId) {
    throw new Error("Enter area final scores before publishing");
  }

  const { error } = await service
    .from("sd_sets")
    .update({
      status: "published",
      winner_branch_id: winnerId,
      published_at: new Date().toISOString(),
    })
    .eq("id", setId);
  if (error) throw new Error(error.message);

  await logAudit(email, "publish_sd_set", setId, {
    area: set.area,
    set_type: set.set_type,
    winner_branch_id: winnerId,
  });

  const event = await getSdEvent();
  if (set.set_type === "area_final") {
    try {
      if (event && isRegionalAverageFormat(event.tournament_format)) {
        const svc = await createServiceClient();
        await ensureRegionalSetsForEvent(svc, set.event_id);
      } else {
        await syncWildcardRound(set.event_id);
        await trySyncKnockoutBracket(set.event_id);
      }
    } catch {
      /* wildcard/knockout tables may not exist until migrations 019/020 */
    }
  }

  scheduleSdRevalidation({ area: set.area });
  return { winnerId };
}

async function publishRegionalSdSet(
  setId: string,
  set: {
    event_id: string;
    area: string;
    set_type: string;
    status: string;
  },
  email: string
): Promise<{ winnerId: string | null }> {
  const service = await createServiceClient();
  const { getSdRegionalContext } = await import(
    "@/lib/products/sword-duels/queries"
  );
  const region = set.area as import("@/lib/scoring-config").Region;
  const ctx = await getSdRegionalContext(set.event_id, region);
  if (!ctx.allAreaFinalsPublished) {
    throw new Error(
      "Publish all area finals before regional rounds for this region"
    );
  }
  if (ctx.participants.length === 0) {
    throw new Error("No area representatives in this region yet");
  }

  const prior = priorRegionalSetType(set.set_type);
  if (prior) {
    const priorSet = ctx.sets.find((s) => s.set_type === prior);
    if (priorSet?.status !== "published") {
      throw new Error("Publish the previous regional round first");
    }
  }

  const scores = ctx.scoreMap.get(setId) ?? [];
  if (scores.length === 0) {
    throw new Error("Enter scores for area representatives before publishing");
  }

  const { error } = await service
    .from("sd_sets")
    .update({
      status: "published",
      winner_branch_id: null,
      published_at: new Date().toISOString(),
    })
    .eq("id", setId);
  if (error) throw new Error(error.message);

  await logAudit(email, "publish_sd_regional_round", setId, {
    region: set.area,
    set_type: set.set_type,
  });

  if (set.set_type === "regional_r3") {
    await trySyncV2KnockoutBracket(set.event_id);
  }

  scheduleSdRevalidation();
  scheduleSdNationalsRevalidation();
  return { winnerId: null };
}

export async function unpublishSdSet(setId: string): Promise<SdActionResult> {
  try {
    const { email } = await requireAdmin();
    const service = await createServiceClient();

    const { data: set } = await service
      .from("sd_sets")
      .select("id, area, set_type, event_id, status")
      .eq("id", setId)
      .single();
    if (!set) throw new Error("Set not found");

    if (set.set_type === "group_a" || set.set_type === "group_b") {
      const { data: finalSet } = await service
        .from("sd_sets")
        .select("status")
        .eq("event_id", set.event_id)
        .eq("area", set.area)
        .eq("set_type", "area_final")
        .maybeSingle();
      if (finalSet?.status === "published") {
        throw new Error("Unpublish the area final before reverting group battles");
      }
    }

    const { error } = await service
      .from("sd_sets")
      .update({
        status: "draft",
        winner_branch_id: null,
        published_at: null,
      })
      .eq("id", setId);
    if (error) throw new Error(error.message);

    if (set.set_type === "group_a" || set.set_type === "group_b") {
      const { data: finalSet } = await service
        .from("sd_sets")
        .select("id, status")
        .eq("event_id", set.event_id)
        .eq("area", set.area)
        .eq("set_type", "area_final")
        .maybeSingle();
      if (finalSet && finalSet.status !== "draft") {
        await service
          .from("sd_sets")
          .update({ status: "draft", winner_branch_id: null, published_at: null })
          .eq("id", finalSet.id);
      }
    }

    await logAudit(email, "unpublish_sd_set", setId, {
      area: set.area,
      set_type: set.set_type,
    });

    if (set.set_type === "area_final") {
      try {
        const event = await getSdEvent();
        if (!event || !isRegionalAverageFormat(event.tournament_format)) {
          await syncWildcardRound(set.event_id);
          await trySyncKnockoutBracket(set.event_id);
        }
      } catch {
        /* wildcard/knockout tables may not exist until migrations 019/020 */
      }
    }

    if (isRegionalSetType(set.set_type)) {
      await trySyncV2KnockoutBracket(set.event_id);
      scheduleSdNationalsRevalidation();
    }

    scheduleSdRevalidation({ area: isRegionalSetType(set.set_type) ? undefined : set.area });
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unpublish failed",
    };
  }
}

export type SdRepresentativesPreviewRow = {
  branch_code: string;
  branch_name: string | null;
  area: string | null;
  representative_1: string;
  representative_2: string;
  representative_1_employee_no: string;
  representative_1_position: string;
  representative_2_employee_no: string;
  representative_2_position: string;
  status: "ready" | "unknown_code" | "missing_rep1";
};

export async function previewSdRepresentativesImport(csvText: string): Promise<{
  rows: SdRepresentativesPreviewRow[];
  errors: string[];
  readyCount: number;
}> {
  await requireAdmin();

  if (!csvText?.trim()) {
    return { rows: [], errors: ["Paste or upload a CSV first."], readyCount: 0 };
  }

  const { rows: parsed, errors: parseErrors } = parseRepresentativesCsv(csvText);
  if (parseErrors.length) {
    return { rows: [], errors: parseErrors, readyCount: 0 };
  }

  const service = await createServiceClient();
  const { data: branches } = await service
    .from("branches")
    .select("branch_code, branch_name, area")
    .eq("is_active", true);

  const byCode = new Map(
    (branches ?? []).map((b) => [b.branch_code.toLowerCase(), b])
  );

  const previewRows: SdRepresentativesPreviewRow[] = parsed.map((row) => {
    const match = byCode.get(row.branch_code.toLowerCase());
    const preview = {
      branch_code: row.branch_code,
      representative_1: row.representative_1,
      representative_2: row.representative_2 ?? "",
      representative_1_employee_no: row.representative_1_employee_no ?? "",
      representative_1_position: row.representative_1_position ?? "",
      representative_2_employee_no: row.representative_2_employee_no ?? "",
      representative_2_position: row.representative_2_position ?? "",
    };
    if (!match) {
      return {
        ...preview,
        branch_name: null,
        area: null,
        status: "unknown_code" as const,
      };
    }
    return {
      ...preview,
      branch_name: match.branch_name,
      area: match.area,
      status: "ready" as const,
    };
  });

  const readyCount = previewRows.filter((r) => r.status === "ready").length;
  return { rows: previewRows, errors: [], readyCount };
}

export async function importSdRepresentativesFromCsv(csvText: string): Promise<{
  ok: boolean;
  count?: number;
  message?: string;
  warnings?: string[];
  errors?: string[];
}> {
  const { email } = await requireAdmin();

  if (!csvText?.trim()) {
    return { ok: false, errors: ["CSV file is empty."] };
  }

  const { rows, errors: parseErrors } = parseRepresentativesCsv(csvText);
  if (parseErrors.length) return { ok: false, errors: parseErrors };
  if (!rows.length) {
    return { ok: false, errors: ["No rows found in CSV."] };
  }

  const service = await createServiceClient();
  const { data: branches } = await service
    .from("branches")
    .select("id, branch_code")
    .eq("is_active", true);

  const codeToBranch = new Map(
    (branches ?? []).map((b) => [b.branch_code.toLowerCase(), b])
  );

  const notFound: string[] = [];
  const now = new Date().toISOString();
  let updated = 0;
  const { linkBranchRepresentativesFromPayload } = await import("@/lib/employees");

  for (const row of rows) {
    const branch = codeToBranch.get(row.branch_code.toLowerCase());
    if (!branch) {
      notFound.push(row.branch_code);
      continue;
    }

    try {
      await linkBranchRepresentativesFromPayload(
        service,
        branch.id,
        branch.branch_code,
        representativeCsvRowToPayload(row),
        now
      );
    } catch (e) {
      return {
        ok: false,
        errors: [e instanceof Error ? e.message : "Import failed"],
      };
    }
    updated++;
  }

  const warnings: string[] = [];
  if (notFound.length) {
    warnings.push(
      `Unknown branch_code (import branches first): ${notFound.slice(0, 5).join(", ")}${notFound.length > 5 ? ` (+${notFound.length - 5} more)` : ""}`
    );
  }

  await logAudit(email, "import_sd_representatives", null, {
    updated,
    row_count: rows.length,
  });

  scheduleSdRevalidation({ brackets: true });

  if (updated === 0) {
    return { ok: false, errors: warnings.length ? warnings : ["No rows imported."] };
  }

  return {
    ok: true,
    count: updated,
    warnings: warnings.length ? warnings : undefined,
    message: `Imported representatives for ${updated} branch${updated === 1 ? "" : "es"}.`,
  };
}

export async function updateSdTournamentFormat(
  format: SdTournamentFormat
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { email } = await requireAdmin();
    const service = await createServiceClient();
    const event = await getSdEvent();
    if (!event) throw new Error("Sword Duels event not found");

    if (format !== event.tournament_format) {
      const locked = await sdEventHasPublishedScores(event.id);
      if (locked) {
        return {
          ok: false,
          error:
            "Cannot change format after scores have been published. Unpublish all sets first.",
        };
      }
    }

    const { error } = await service
      .from("sd_events")
      .update({ tournament_format: format })
      .eq("id", event.id);
    if (error) throw new Error(error.message);

    if (isRegionalAverageFormat(format)) {
      await ensureRegionalSetsForEvent(service, event.id);
    }

    await logAudit(email, "update_sd_tournament_format", event.id, { format });
    scheduleSdRevalidation();
    scheduleSdNationalsRevalidation();
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Save failed",
    };
  }
}

export async function updateSdGroupSortMode(
  mode: SdGroupSortMode
): Promise<void> {
  const { email } = await requireAdmin();
  const service = await createServiceClient();
  const event = await getSdEvent();
  if (!event) throw new Error("Sword Duels event not found");

  const { error } = await service
    .from("sd_events")
    .update({ group_sort_mode: mode })
    .eq("id", event.id);
  if (error) throw new Error(error.message);

  await logAudit(email, "update_sd_group_sort", event.id, { group_sort_mode: mode });
  scheduleSdRevalidation();
}

export type SdWildcardScoreInput = {
  branch_id: string;
  points: number;
};

export async function saveSdWildcardScores(
  scores: SdWildcardScoreInput[]
): Promise<void> {
  const { email } = await requireAdmin();
  const service = await createServiceClient();
  const event = await getSdEvent();
  if (!event) throw new Error("Sword Duels event not found");

  const { data: round } = await service
    .from("sd_wildcard_rounds")
    .select("id, status")
    .eq("event_id", event.id)
    .single();

  if (!round) throw new Error("Wildcard round not initialized — publish all area finals first");
  if (round.status !== "tiebreak_draft") {
    throw new Error("Unpublish the wildcard round before editing scores");
  }

  const now = new Date().toISOString();
  for (const row of scores) {
    const { error } = await service
      .from("sd_wildcard_scores")
      .update({
        points: row.points,
        updated_at: now,
      })
      .eq("wildcard_round_id", round.id)
      .eq("branch_id", row.branch_id);
    if (error) throw new Error(error.message);
  }

  await logAudit(email, "save_sd_wildcard_scores", round.id, {
    count: scores.length,
  });
  scheduleSdNationalsRevalidation();
}

export async function publishSdWildcardRoundForm(): Promise<void> {
  const { email } = await requireAdmin();
  const event = await getSdEvent();
  if (!event) throw new Error("Sword Duels event not found");

  await publishWildcardRound(event.id);

  await trySyncKnockoutBracket(event.id);

  await logAudit(email, "publish_sd_wildcard_round", event.id, {});
  scheduleSdNationalsRevalidation();
}

export async function unpublishSdWildcardRoundForm(): Promise<void> {
  const { email } = await requireAdmin();
  const event = await getSdEvent();
  if (!event) throw new Error("Sword Duels event not found");

  await unpublishWildcardRound(event.id);

  await trySyncKnockoutBracket(event.id);

  await logAudit(email, "unpublish_sd_wildcard_round", event.id, {});
  scheduleSdNationalsRevalidation();
}

export async function syncSdWildcardRoundForm(): Promise<void> {
  await requireAdmin();
  const event = await getSdEvent();
  if (!event) throw new Error("Sword Duels event not found");

  await syncWildcardRound(event.id);
  await trySyncKnockoutBracket(event.id);
  scheduleSdNationalsRevalidation();
}

export type SdKnockoutScoreInput = {
  branch_id: string;
  points: number;
};

export async function saveSdKnockoutMatchScores(
  matchId: string,
  scores: SdKnockoutScoreInput[]
): Promise<void> {
  const { email } = await requireAdmin();
  await saveKnockoutMatchScores(matchId, scores);
  await logAudit(email, "save_sd_knockout_scores", matchId, {
    count: scores.length,
  });
  scheduleSdNationalsRevalidation();
}

export async function publishSdKnockoutMatchForm(matchId: string): Promise<void> {
  const { email } = await requireAdmin();
  await publishKnockoutMatch(matchId);
  await logAudit(email, "publish_sd_knockout_match", matchId, {});
  scheduleSdNationalsRevalidation();
}

export async function unpublishSdKnockoutMatchForm(matchId: string): Promise<void> {
  const { email } = await requireAdmin();
  await unpublishKnockoutMatch(matchId);
  await logAudit(email, "unpublish_sd_knockout_match", matchId, {});
  scheduleSdNationalsRevalidation();
}

export async function syncSdKnockoutBracketForm(): Promise<void> {
  await requireAdmin();
  const event = await getSdEvent();
  if (!event) throw new Error("Sword Duels event not found");

  await trySyncKnockoutBracket(event.id);
  scheduleSdNationalsRevalidation();
}

export async function saveSdAreaSchedulesForm(
  config: import("@/lib/products/sword-duels/area-schedules").SdAreaSchedulesConfig
): Promise<void> {
  const { email } = await requireAdmin();
  const service = await createServiceClient();
  await persistSdAreaSchedulesWithCalendar(service, email, config);
}

export async function saveSdAreaBattleScheduleAction(
  area: string,
  dates: import("@/lib/products/sword-duels/area-schedules").SdAreaScheduleDates
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  try {
    const { email } = await requireAdmin();
    const service = await createServiceClient();
    const { SD_AREA_SCHEDULES_SLUG, parseSdAreaSchedulesBody } = await import(
      "@/lib/products/sword-duels/area-schedules"
    );

    const { data: row } = await service
      .from("site_content")
      .select("body")
      .eq("slug", SD_AREA_SCHEDULES_SLUG)
      .maybeSingle();

    const config = parseSdAreaSchedulesBody(row?.body);
    config.byArea[area] = dates;

    await persistSdAreaSchedulesWithCalendar(service, email, config, area);

    const synced = [
      dates.groupA && "Set 1",
      dates.groupB && "Set 2",
      dates.areaFinal && "area final",
    ].filter(Boolean);

    return {
      ok: true,
      message:
        synced.length > 0
          ? `Saved ${area} schedule (${synced.join(", ")}) and updated the event calendar.`
          : `Cleared ${area} battle times on the event calendar.`,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Save failed.",
    };
  }
}

async function persistSdAreaSchedulesWithCalendar(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  email: string,
  config: import("@/lib/products/sword-duels/area-schedules").SdAreaSchedulesConfig,
  auditArea?: string
): Promise<void> {
  const { SD_AREA_SCHEDULES_SLUG } = await import(
    "@/lib/products/sword-duels/area-schedules"
  );
  const { EVENTS_CALENDAR_SLUG, parseEventsCalendarBody } = await import(
    "@/lib/events-calendar"
  );
  const { mergeAllAreaSchedulesIntoCalendar } = await import(
    "@/lib/products/sword-duels/sync-area-schedules-calendar"
  );

  const { error: scheduleError } = await service.from("site_content").upsert(
    {
      slug: SD_AREA_SCHEDULES_SLUG,
      body: config,
      updated_at: new Date().toISOString(),
      updated_by_email: email,
    },
    { onConflict: "slug" }
  );
  if (scheduleError) throw new Error(scheduleError.message);

  const { data: calendarRow } = await service
    .from("site_content")
    .select("body")
    .eq("slug", EVENTS_CALENDAR_SLUG)
    .maybeSingle();

  const calendar = parseEventsCalendarBody(calendarRow?.body);
  const merged = mergeAllAreaSchedulesIntoCalendar(calendar, config.byArea);

  const calendarPayload = {
    events: merged.events.map((e) => ({
      id: e.id,
      kind: e.kind,
      title: e.title.trim(),
      startAt: e.startAt,
      published: e.published,
      program: e.program,
      ...(e.endAt ? { endAt: e.endAt } : {}),
      ...(e.timeLabel ? { timeLabel: e.timeLabel.trim() } : {}),
      ...(e.areas?.length ? { areas: e.areas } : {}),
      ...(e.setLabel ? { setLabel: e.setLabel.trim() } : {}),
      ...(e.description ? { description: e.description.trim() } : {}),
    })),
  };

  const { error: calendarError } = await service.from("site_content").upsert(
    {
      slug: EVENTS_CALENDAR_SLUG,
      body: calendarPayload,
      updated_at: new Date().toISOString(),
      updated_by_email: email,
    },
    { onConflict: "slug" }
  );
  if (calendarError) throw new Error(calendarError.message);

  await logAudit(email, "save_sd_area_schedules", SD_AREA_SCHEDULES_SLUG, {
    areas: Object.keys(config.byArea).length,
    area: auditArea,
    calendarSynced: true,
  });

  scheduleSdRevalidation({ home: true });
}

export async function saveEventsCalendarForm(
  config: import("@/lib/events-calendar").EventsCalendarConfig
): Promise<void> {
  const { email } = await requireAdmin();
  const service = await createServiceClient();
  const { EVENTS_CALENDAR_SLUG } = await import("@/lib/events-calendar");

  const payload = {
    events: config.events.map((e) => ({
      id: e.id,
      kind: e.kind,
      title: e.title.trim(),
      startAt: e.startAt,
      published: e.published,
      program: e.program,
      ...(e.endAt ? { endAt: e.endAt } : {}),
      ...(e.timeLabel ? { timeLabel: e.timeLabel.trim() } : {}),
      ...(e.areas?.length ? { areas: e.areas } : {}),
      ...(e.setLabel ? { setLabel: e.setLabel.trim() } : {}),
      ...(e.description ? { description: e.description.trim() } : {}),
    })),
  };

  const { error } = await service.from("site_content").upsert(
    {
      slug: EVENTS_CALENDAR_SLUG,
      body: payload,
      updated_at: new Date().toISOString(),
      updated_by_email: email,
    },
    { onConflict: "slug" }
  );

  if (error) throw new Error(error.message);

  await logAudit(email, "save_events_calendar", EVENTS_CALENDAR_SLUG, {
    count: payload.events.length,
    published: payload.events.filter((e) => e.published).length,
  });

  scheduleSdRevalidation({ home: true });
}
