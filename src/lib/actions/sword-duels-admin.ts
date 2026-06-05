"use server";

import { revalidatePath } from "next/cache";
import { SWORD_DUELS_ADMIN, SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import { buildAreaBrackets } from "@/lib/products/sword-duels/area-groups";
import {
  getSdAreaContext,
  getSdEvent,
  participantsForSetType,
} from "@/lib/products/sword-duels/queries";
import { computeSetResults } from "@/lib/products/sword-duels/scoring";
import type { SdScoringMode, SdSetType } from "@/lib/products/sword-duels/types";
import { SD_SET_ORDER } from "@/lib/products/sword-duels/types";
import { requireAdminEmail } from "@/lib/admin-auth";
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
  revalidatePath(`${SWORD_DUELS_ADMIN}/areas`);
  revalidatePath(SWORD_DUELS_PUBLIC);
  if (area) {
    revalidatePath(`${SWORD_DUELS_PUBLIC}/${encodeURIComponent(area)}`);
    revalidatePath(`${SWORD_DUELS_ADMIN}/areas/${encodeURIComponent(area)}`);
  }
}

export async function syncSdBracketsForm(): Promise<void> {
  await syncSdBrackets();
}

export async function syncSdBrackets(): Promise<{ areaCount: number }> {
  const { email } = await requireAdmin();
  const service = await createServiceClient();
  const event = await getSdEvent();
  if (!event) throw new Error("Sword Duels event not found");

  const { data: branches } = await service
    .from("branches")
    .select("id, branch_code, branch_name, area, region");
  const brackets = buildAreaBrackets((branches ?? []) as Parameters<typeof buildAreaBrackets>[0]);

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
  });
  revalidateSd();
  return { areaCount: brackets.length };
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
  revalidateSd(set.area);
}
