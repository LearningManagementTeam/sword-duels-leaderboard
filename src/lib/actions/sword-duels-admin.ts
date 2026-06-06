"use server";

import { revalidatePath } from "next/cache";
import { SWORD_DUELS_ADMIN, SWORD_DUELS_PUBLIC, swordDuelsPath } from "@/lib/admin-routes";
import { requireAdminEmail } from "@/lib/admin-auth";
import { buildAreaBrackets } from "@/lib/products/sword-duels/area-groups";
import type { SdGroupSortMode } from "@/lib/products/sword-duels/area-groups";
import {
  getSdAreaContext,
  getSdEvent,
  participantsForSetType,
} from "@/lib/products/sword-duels/queries";
import { computeSetResults } from "@/lib/products/sword-duels/scoring";
import type { SdScoringMode, SdSetType } from "@/lib/products/sword-duels/types";
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
import { parseRepresentativesCsv } from "@/lib/representatives-csv";
import { representativeDbUpdate } from "@/lib/representative-fields";
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

function revalidateSd(area?: string) {
  revalidatePath(SWORD_DUELS_ADMIN);
  revalidatePath(swordDuelsPath("representatives"));
  revalidatePath(swordDuelsPath("areas"));
  revalidatePath(swordDuelsPath("nationals"));
  revalidatePath(SWORD_DUELS_PUBLIC);
  revalidatePath(`${SWORD_DUELS_PUBLIC}/nationals`);
  if (area) {
    revalidatePath(`${SWORD_DUELS_PUBLIC}/${encodeURIComponent(area)}`);
    revalidatePath(swordDuelsPath("areas", encodeURIComponent(area)));
  }
}

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

  await service.from("sd_area_groups").delete().eq("event_id", event.id);

  const rows = brackets.flatMap((b) =>
    [...b.groupA, ...b.groupB].map((g) => ({
      event_id: event.id,
      area: b.area,
      branch_id: g.branch_id,
      group_label: g.group_label,
      sort_order: g.sort_order,
    }))
  );

  if (rows.length > 0) {
    const { error } = await service.from("sd_area_groups").insert(rows);
    if (error) throw new Error(error.message);
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

  await logAudit(email, "sync_sd_brackets", event.id, {
    areaCount: brackets.length,
    branchCount: rows.length,
    group_sort_mode: sortMode,
  });
  revalidateSd();
  return { areaCount: brackets.length, group_sort_mode: sortMode };
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
  revalidateSd();
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

  for (const row of scores) {
    const { error } = await service.from("sd_set_scores").upsert(
      {
        set_id: setId,
        branch_id: row.branch_id,
        points: row.points,
        hearts_remaining: row.hearts_remaining ?? null,
        is_eliminated: row.is_eliminated ?? false,
        active_representative: row.active_representative === 2 ? 2 : 1,
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
  revalidateSd(set.area);
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
    set.set_type as SdSetType,
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

  if (set.set_type === "area_final") {
    try {
      await syncWildcardRound(set.event_id);
      await trySyncKnockoutBracket(set.event_id);
    } catch {
      /* wildcard/knockout tables may not exist until migrations 019/020 */
    }
    revalidatePath(`${SWORD_DUELS_PUBLIC}/nationals`);
    revalidatePath(swordDuelsPath("nationals"));
  }

  revalidateSd(set.area);
  return { winnerId };
}

export async function unpublishSdSet(setId: string): Promise<void> {
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
      await syncWildcardRound(set.event_id);
      await trySyncKnockoutBracket(set.event_id);
    } catch {
      /* wildcard/knockout tables may not exist until migrations 019/020 */
    }
    revalidatePath(`${SWORD_DUELS_PUBLIC}/nationals`);
    revalidatePath(swordDuelsPath("nationals"));
  }

  revalidateSd(set.area);
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
    if (!match) {
      return {
        branch_code: row.branch_code,
        branch_name: null,
        area: null,
        representative_1: row.representative_1,
        representative_2: row.representative_2,
        representative_1_employee_no: row.representative_1_employee_no,
        representative_1_position: row.representative_1_position,
        representative_2_employee_no: row.representative_2_employee_no,
        representative_2_position: row.representative_2_position,
        status: "unknown_code" as const,
      };
    }
    return {
      branch_code: row.branch_code,
      branch_name: match.branch_name,
      area: match.area,
      representative_1: row.representative_1,
      representative_2: row.representative_2,
      representative_1_employee_no: row.representative_1_employee_no,
      representative_1_position: row.representative_1_position,
      representative_2_employee_no: row.representative_2_employee_no,
      representative_2_position: row.representative_2_position,
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

  const codeToId = new Map(
    (branches ?? []).map((b) => [b.branch_code.toLowerCase(), b.id])
  );

  const notFound: string[] = [];
  const now = new Date().toISOString();
  let updated = 0;

  for (const row of rows) {
    const id = codeToId.get(row.branch_code.toLowerCase());
    if (!id) {
      notFound.push(row.branch_code);
      continue;
    }
    const { error } = await service
      .from("branches")
      .update({
        ...representativeDbUpdate({
          representative_1: row.representative_1,
          representative_2: row.representative_2,
          representative_1_employee_no: row.representative_1_employee_no,
          representative_1_position: row.representative_1_position,
          representative_2_employee_no: row.representative_2_employee_no,
          representative_2_position: row.representative_2_position,
        }),
        representatives_updated_at: now,
      })
      .eq("id", id);

    if (error) return { ok: false, errors: [error.message] };
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

  revalidateSd();
  revalidatePath(swordDuelsPath("brackets"));

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
  revalidateSd();
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
  revalidatePath(`${SWORD_DUELS_PUBLIC}/nationals`);
  revalidatePath(swordDuelsPath("nationals"));
}

export async function publishSdWildcardRoundForm(): Promise<void> {
  const { email } = await requireAdmin();
  const event = await getSdEvent();
  if (!event) throw new Error("Sword Duels event not found");

  await publishWildcardRound(event.id);

  await trySyncKnockoutBracket(event.id);

  await logAudit(email, "publish_sd_wildcard_round", event.id, {});
  revalidatePath(`${SWORD_DUELS_PUBLIC}/nationals`);
  revalidatePath(swordDuelsPath("nationals"));
}

export async function unpublishSdWildcardRoundForm(): Promise<void> {
  const { email } = await requireAdmin();
  const event = await getSdEvent();
  if (!event) throw new Error("Sword Duels event not found");

  await unpublishWildcardRound(event.id);

  await trySyncKnockoutBracket(event.id);

  await logAudit(email, "unpublish_sd_wildcard_round", event.id, {});
  revalidatePath(`${SWORD_DUELS_PUBLIC}/nationals`);
  revalidatePath(swordDuelsPath("nationals"));
}

export async function syncSdWildcardRoundForm(): Promise<void> {
  await requireAdmin();
  const event = await getSdEvent();
  if (!event) throw new Error("Sword Duels event not found");

  await syncWildcardRound(event.id);
  await trySyncKnockoutBracket(event.id);
  revalidatePath(`${SWORD_DUELS_PUBLIC}/nationals`);
  revalidatePath(swordDuelsPath("nationals"));
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
  revalidatePath(`${SWORD_DUELS_PUBLIC}/nationals`);
  revalidatePath(swordDuelsPath("nationals"));
}

export async function publishSdKnockoutMatchForm(matchId: string): Promise<void> {
  const { email } = await requireAdmin();
  await publishKnockoutMatch(matchId);
  await logAudit(email, "publish_sd_knockout_match", matchId, {});
  revalidatePath(`${SWORD_DUELS_PUBLIC}/nationals`);
  revalidatePath(swordDuelsPath("nationals"));
}

export async function unpublishSdKnockoutMatchForm(matchId: string): Promise<void> {
  const { email } = await requireAdmin();
  await unpublishKnockoutMatch(matchId);
  await logAudit(email, "unpublish_sd_knockout_match", matchId, {});
  revalidatePath(`${SWORD_DUELS_PUBLIC}/nationals`);
  revalidatePath(swordDuelsPath("nationals"));
}

export async function syncSdKnockoutBracketForm(): Promise<void> {
  await requireAdmin();
  const event = await getSdEvent();
  if (!event) throw new Error("Sword Duels event not found");

  const ctx = await getSdNationalsContext(event.id);
  await syncKnockoutBracket(event.id, ctx.model);
  revalidatePath(`${SWORD_DUELS_PUBLIC}/nationals`);
  revalidatePath(swordDuelsPath("nationals"));
}

export async function saveSdAreaSchedulesForm(
  config: import("@/lib/products/sword-duels/area-schedules").SdAreaSchedulesConfig
): Promise<void> {
  const { email } = await requireAdmin();
  const service = await createServiceClient();
  const { SD_AREA_SCHEDULES_SLUG } = await import(
    "@/lib/products/sword-duels/area-schedules"
  );

  const { error } = await service.from("site_content").upsert(
    {
      slug: SD_AREA_SCHEDULES_SLUG,
      body: config,
      updated_at: new Date().toISOString(),
      updated_by_email: email,
    },
    { onConflict: "slug" }
  );

  if (error) throw new Error(error.message);

  await logAudit(email, "save_sd_area_schedules", SD_AREA_SCHEDULES_SLUG, {
    areas: Object.keys(config.byArea).length,
  });

  revalidatePath("/");
  revalidatePath(SWORD_DUELS_PUBLIC, "layout");
  revalidatePath(swordDuelsPath("schedules"));
}
