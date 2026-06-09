"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { parseBranchesCsv } from "@/lib/branches-csv";
import {
  branchRosterDbRow,
  type BranchRosterFields,
  normalizeBranchCode,
  validateBranchRosterFields,
} from "@/lib/branch-roster";
import { branchUpsertPayload, countRowsWithRepresentatives } from "@/lib/branch-upsert";
import { parseEmployeeDirectoryCsv } from "@/lib/employees-csv";
import {
  parseRepresentativesCsv,
  representativeCsvRowToPayload,
} from "@/lib/representatives-csv";
import {
  representativeDbUpdate,
  type RepresentativeSavePayload,
} from "@/lib/representative-fields";
import { resolveParticipantBranchIds, assertSeasonParticipantsReady } from "@/lib/season-participants";
import {
  aggregatePublishedResults,
  computeStandings,
} from "@/lib/scoring";
import type { Region, SeasonSlug } from "@/lib/scoring-config";
import {
  validateFinishOrder,
  validateRoundPoints,
} from "@/lib/scoring-config";
import { SCORING_CONFIG, REGIONS } from "@/lib/scoring-config";
import type { ManualAdvance } from "@/lib/manual-advances";
import {
  BRANDING_CONTENT_SLUG,
  DEFAULT_BRANDING,
  finalizeBrandingConfig,
  parseBrandingBody,
  type BrandingConfig,
} from "@/lib/branding";
import { revalidateBrandingPublicPaths } from "@/lib/branding-revalidate";
import {
  persistEmployeePhotoRemove,
  persistEmployeePhotoUpload,
} from "@/lib/employee-photo-upload";
import {
  COMPETITION_MAP_SLUG,
  type CompetitionMapConfig,
  type CompetitionMilestoneId,
} from "@/lib/competition-map";
import {
  MECHANICS_CONTENT_SLUG,
  type MechanicsPublicBody,
} from "@/lib/mechanics-content";
import {
  getLatestPublishedRoundNumber,
  getLatestPublishedRoundInfo,
  getSeasonBySlug,
} from "@/lib/data/queries";
import type { StandingRow } from "@/lib/types";
import { getBranding } from "@/lib/data/content-queries";
import {
  createClient,
  createServiceClient,
  isSupabaseConfigured,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/server";
import { requireAdminEmail } from "@/lib/admin-auth";
import {
  parseCarouselSlot,
  removeCarouselSlideSlot,
  uploadCarouselSlideFile,
} from "@/lib/branding-carousel";

import { brandingAssetUrl } from "@/lib/branding-storage";

async function requireAdmin() {
  const email = await requireAdminEmail();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user, email };
}

async function logAudit(
  email: string,
  action: string,
  entity_type: string,
  entity_id: string | null,
  details: Record<string, unknown>
) {
  try {
    const service = await createServiceClient();
    const { error } = await service.from("audit_log").insert({
      admin_email: email,
      action,
      entity_type,
      entity_id,
      details,
    });
    if (error) {
      console.error("audit_log insert failed:", error.message);
    }
  } catch (e) {
    console.error("audit_log insert failed:", e);
  }
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
  const now = new Date().toISOString();
  const { error } = await service.from("branches").upsert(
    rows.map((r) => branchUpsertPayload(r, now)),
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
export async function previewParticipatingBranchesImport(csvText: string) {
  await requireAdmin();

  if (!csvText?.trim()) {
    return {
      ok: false as const,
      rowCount: 0,
      regionCounts: { luzon: 0, ncr: 0, vismin: 0 } as Record<Region, number>,
      representativesCount: 0,
      sampleBranches: [] as string[],
      errors: ["CSV file is empty."],
    };
  }

  const { rows, errors } = parseBranchesCsv(csvText);
  const regionCounts: Record<Region, number> = { luzon: 0, ncr: 0, vismin: 0 };
  for (const row of rows) {
    regionCounts[row.region]++;
  }

  return {
    ok: errors.length === 0,
    rowCount: rows.length,
    regionCounts,
    representativesCount: countRowsWithRepresentatives(rows),
    sampleBranches: rows.slice(0, 5).map((r) => r.branch_name),
    errors,
  };
}

export async function getJuneImportGuard() {
  await requireAdmin();

  if (!isSupabaseServiceConfigured()) {
    return {
      blocked: false,
      warning: false,
      publishedRoundNumbers: [] as number[],
      message: null as string | null,
    };
  }

  const service = await createServiceClient();
  const { data: season } = await service
    .from("seasons")
    .select("id")
    .eq("slug", "june_area")
    .single();

  if (!season) {
    return {
      blocked: false,
      warning: false,
      publishedRoundNumbers: [] as number[],
      message: null as string | null,
    };
  }

  const { data: rounds } = await service
    .from("rounds")
    .select("round_number, status")
    .eq("season_id", season.id)
    .eq("status", "published");

  const publishedRoundNumbers = (rounds ?? [])
    .map((r) => r.round_number)
    .sort((a, b) => a - b);

  if (publishedRoundNumbers.some((n) => n >= 2)) {
    return {
      blocked: true,
      warning: true,
      publishedRoundNumbers,
      message: `June Round ${Math.max(...publishedRoundNumbers)} or earlier is already live. Re-import is blocked to protect published standings.`,
    };
  }

  if (publishedRoundNumbers.includes(1)) {
    return {
      blocked: false,
      warning: true,
      publishedRoundNumbers,
      message:
        "June Round 1 is already published. Re-importing replaces branch records and re-seeds Round 1 draft rows.",
    };
  }

  return {
    blocked: false,
    warning: false,
    publishedRoundNumbers,
    message: null as string | null,
  };
}

async function assertJuneImportAllowed(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  seasonId: string,
  force?: boolean
): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  const { data: rounds } = await service
    .from("rounds")
    .select("round_number, status")
    .eq("season_id", seasonId)
    .eq("status", "published");

  const publishedRoundNumbers = (rounds ?? [])
    .map((r) => r.round_number)
    .sort((a, b) => a - b);

  if (publishedRoundNumbers.some((n) => n >= 2)) {
    return {
      ok: false,
      errors: [
        `June Round ${Math.max(...publishedRoundNumbers)} is already live. Re-import is blocked once Round 2+ has been published.`,
      ],
    };
  }

  if (publishedRoundNumbers.includes(1) && !force) {
    return {
      ok: false,
      errors: [
        "June Round 1 is already published. Confirm the re-import warning in the admin UI before proceeding.",
      ],
    };
  }

  return { ok: true };
}

export async function importParticipatingBranchesForJuneArea(
  csvText: string,
  options?: { force?: boolean }
) {
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
  const now = new Date().toISOString();
  const withReps = countRowsWithRepresentatives(rows);

  const { error: branchError } = await service.from("branches").upsert(
    rows.map((r) => branchUpsertPayload(r, now)),
    { onConflict: "branch_code" }
  );
  if (branchError) {
    return { ok: false as const, errors: [branchError.message] };
  }

  const repRows = rows.filter((r) => r.representative_1?.trim());
  if (repRows.length > 0) {
    const { data: importedForReps } = await service
      .from("branches")
      .select("id, branch_code")
      .in(
        "branch_code",
        repRows.map((r) => r.branch_code)
      );
    const { linkBranchRepresentativesFromPayload } = await import("@/lib/employees");
    for (const csvRow of repRows) {
      const branch = (importedForReps ?? []).find(
        (b) => b.branch_code === csvRow.branch_code
      );
      if (!branch) continue;
      await linkBranchRepresentativesFromPayload(
        service,
        branch.id,
        branch.branch_code,
        {
          representative_1: csvRow.representative_1 ?? "",
          representative_2: csvRow.representative_2 ?? "",
          representative_1_employee_no: csvRow.representative_1_employee_no ?? "",
          representative_1_position: csvRow.representative_1_position ?? "",
          representative_2_employee_no: csvRow.representative_2_employee_no ?? "",
          representative_2_position: csvRow.representative_2_position ?? "",
        },
        now
      );
    }
  }

  const { data: season } = await service
    .from("seasons")
    .select("id")
    .eq("slug", "june_area")
    .single();
  if (!season) {
    return { ok: false as const, errors: ["June season not found in database."] };
  }

  const importGuard = await assertJuneImportAllowed(service, season.id, options?.force);
  if (!importGuard.ok) {
    return { ok: false as const, errors: importGuard.errors };
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

  const codes = rows.map((r) => r.branch_code);
  const { data: importedBranches } = await service
    .from("branches")
    .select("id")
    .in("branch_code", codes);
  const branchIds = (importedBranches ?? []).map((b) => b.id);

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
    representatives_count: withReps,
    round_id: round.id,
    round_seeded: true,
  });

  revalidatePath("/", "layout");
  const repNote =
    withReps > 0
      ? ` ${withReps} include representative names.`
      : " Add representative columns to the CSV or edit names under Admin → Representatives.";
  return {
    ok: true as const,
    count: rows.length,
    representativesCount: withReps,
    roundId: round.id,
    message: `Imported ${rows.length} branches and prepared June Round 1.${repNote}`,
  };
}

export async function saveBranchRepresentatives(
  updates: RepresentativeSavePayload[]
) {
  const { email } = await requireAdmin();
  const service = await createServiceClient();
  const now = new Date().toISOString();

  const branchIds = updates.map((row) => row.branch_id);
  const { data: branchRows } = await service
    .from("branches")
    .select("id, branch_code")
    .in("id", branchIds);
  const codeById = new Map(
    (branchRows ?? []).map((b) => [b.id, b.branch_code as string])
  );

  for (const row of updates) {
    const branchCode = codeById.get(row.branch_id);
    if (!branchCode) {
      return { ok: false as const, errors: ["Branch not found for representative update."] };
    }

    try {
      const { linkBranchRepresentativesFromPayload } = await import(
        "@/lib/employees"
      );
      await linkBranchRepresentativesFromPayload(
        service,
        row.branch_id,
        branchCode,
        row,
        now
      );
    } catch (e) {
      return {
        ok: false as const,
        errors: [e instanceof Error ? e.message : "Failed to save representatives"],
      };
    }
  }

  await logAudit(email, "save_representatives", "branches", null, {
    count: updates.length,
  });
  revalidatePath("/admin/national-competitions/representatives");
  revalidatePath("/admin/hris/employees");
  revalidatePath("/admin/sword-duels/representatives");
  revalidatePath("/sword-duels");
  return { ok: true as const, count: updates.length };
}

function revalidateEmployeePaths() {
  revalidatePath("/admin/hris/employees");
  revalidatePath("/admin/hris/branches");
  revalidatePath("/admin/national-competitions/representatives");
  revalidatePath("/admin/sword-duels/representatives");
  revalidatePath("/sword-duels", "layout");
  revalidatePath("/", "layout");
}

function revalidateEmployeePhotoPaths() {
  revalidatePath("/admin/hris/employees");
}

export async function saveEmployeeProfileAction(
  employeeId: string,
  fields: {
    employee_no: string;
    full_name: string;
    position: string;
    notes?: string;
    home_branch_id?: string | null;
    nickname?: string | null;
    date_hired?: string | null;
    contact_number?: string | null;
    email?: string | null;
  }
) {
  try {
    const { email } = await requireAdmin();
    const { updateEmployeeProfile, syncBranchRepTextFromEmployee } = await import(
      "@/lib/employees"
    );

    const employee = await updateEmployeeProfile(employeeId, fields);
    await syncBranchRepTextFromEmployee(employee.id);

    await logAudit(email, "update_employee", "employee", employeeId, {
      employee_no: employee.employee_no,
    });
    revalidateEmployeePaths();
    return { ok: true as const, employee };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Save failed.",
    };
  }
}

export async function createEmployeeAction(fields: {
  employee_no: string;
  full_name: string;
  position?: string;
  notes?: string;
  home_branch_id?: string | null;
  nickname?: string | null;
  date_hired?: string | null;
  contact_number?: string | null;
  email?: string | null;
}) {
  try {
    const { email } = await requireAdmin();
    const { createEmployeeRecord } = await import("@/lib/employees");

    const employee = await createEmployeeRecord(fields);
    await logAudit(email, "create_employee", "employee", employee.id, {
      employee_no: employee.employee_no,
    });
    revalidateEmployeePaths();
    return { ok: true as const, employee };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Create failed.",
    };
  }
}

export async function deleteEmployeeAction(employeeId: string) {
  try {
    const { email } = await requireAdmin();
    const { deleteEmployeeRecord } = await import("@/lib/employees");

    const deleted = await deleteEmployeeRecord(employeeId);
    await logAudit(email, "delete_employee", "employee", employeeId, {
      employee_no: deleted.employee_no,
      full_name: deleted.full_name,
    });
    revalidateEmployeePaths();
    return { ok: true as const, deleted };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Delete failed.",
    };
  }
}

export async function deleteEmployeesAction(employeeIds: string[]) {
  try {
    const { email } = await requireAdmin();
    const { deleteEmployeeRecord } = await import("@/lib/employees");

    const uniqueIds = [...new Set(employeeIds.map((id) => id.trim()).filter(Boolean))];
    if (uniqueIds.length === 0) {
      return { ok: false as const, error: "No employees selected." };
    }

    let deletedCount = 0;
    const errors: string[] = [];

    for (const employeeId of uniqueIds) {
      try {
        const deleted = await deleteEmployeeRecord(employeeId);
        deletedCount += 1;
        await logAudit(email, "delete_employee", "employee", employeeId, {
          employee_no: deleted.employee_no,
          full_name: deleted.full_name,
          bulk: true,
        });
      } catch (e) {
        errors.push(e instanceof Error ? e.message : "Delete failed.");
      }
    }

    if (deletedCount === 0) {
      return {
        ok: false as const,
        error: errors[0] ?? "Delete failed.",
      };
    }

    revalidateEmployeePaths();
    return {
      ok: true as const,
      deletedCount,
      errors,
    };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Delete failed.",
    };
  }
}

export async function setEmployeeEmploymentStatusAction(
  employeeId: string,
  status: import("@/lib/employees").EmploymentStatus
) {
  try {
    const { email } = await requireAdmin();
    const { setEmployeeEmploymentStatus } = await import("@/lib/employees");

    const employee = await setEmployeeEmploymentStatus(employeeId, status);
    await logAudit(email, "set_employee_status", "employee", employeeId, {
      status,
    });
    revalidateEmployeePaths();
    return { ok: true as const, employee };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Status update failed.",
    };
  }
}

export async function uploadEmployeePhotoAction(
  employeeId: string,
  formData: FormData
) {
  try {
    const { email } = await requireAdmin();
    const entry = formData.get("file");

    if (!(entry instanceof Blob) || entry.size === 0) {
      return { ok: false as const, error: "Choose a photo to upload." };
    }

    const result = await persistEmployeePhotoUpload(employeeId, entry);
    if (!result.ok) {
      return { ok: false as const, error: result.error };
    }

    await logAudit(email, "upload_employee_photo", "employee", employeeId, {
      photo_path: result.photoUrl,
    });
    revalidateEmployeePhotoPaths();
    return { ok: true as const, photoUrl: result.photoUrl };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Photo upload failed.",
    };
  }
}

export async function removeEmployeePhotoAction(employeeId: string) {
  try {
    const { email } = await requireAdmin();

    const result = await persistEmployeePhotoRemove(employeeId);
    if (!result.ok) {
      return { ok: false as const, error: result.error };
    }

    await logAudit(email, "remove_employee_photo", "employee", employeeId, {});
    revalidateEmployeePhotoPaths();
    return { ok: true as const };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Photo remove failed.",
    };
  }
}

function revalidateBranchRosterPaths() {
  revalidatePath("/admin/hris/branches");
  revalidatePath("/admin/national-competitions/representatives");
  revalidatePath("/admin/sword-duels/representatives");
  revalidatePath("/admin/sword-duels");
  revalidatePath("/sword-duels");
  revalidatePath("/", "layout");
}

async function seedJuneRoundOneForBranch(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  branchId: string
) {
  const { data: season } = await service
    .from("seasons")
    .select("id")
    .eq("slug", "june_area")
    .maybeSingle();
  if (!season) return;

  const { data: round } = await service
    .from("rounds")
    .select("id")
    .eq("season_id", season.id)
    .eq("round_number", 1)
    .maybeSingle();
  if (!round) return;

  await service.from("round_results").upsert(
    {
      round_id: round.id,
      branch_id: branchId,
      points: 0,
      wins: 0,
      losses: 0,
    },
    { onConflict: "round_id,branch_id" }
  );
}

async function assertUniqueBranchCode(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  branchCode: string,
  excludeId?: string
): Promise<string | null> {
  let query = service
    .from("branches")
    .select("id")
    .eq("branch_code", branchCode);
  if (excludeId) {
    query = query.neq("id", excludeId);
  }
  const { data } = await query.maybeSingle();
  if (data) {
    return `Branch code "${branchCode}" is already in use.`;
  }
  return null;
}

export async function createBranchRecord(fields: BranchRosterFields) {
  const { email } = await requireAdmin();
  const validationError = validateBranchRosterFields(fields);
  if (validationError) {
    return { ok: false as const, errors: [validationError] };
  }

  const row = branchRosterDbRow(fields);
  const service = await createServiceClient();
  const clash = await assertUniqueBranchCode(service, row.branch_code);
  if (clash) return { ok: false as const, errors: [clash] };

  const { data, error } = await service
    .from("branches")
    .insert({ ...row, is_active: true })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false as const,
      errors: [error?.message ?? "Could not create branch."],
    };
  }

  await seedJuneRoundOneForBranch(service, data.id as string);

  await logAudit(email, "create_branch", "branches", data.id as string, {
    branch_code: row.branch_code,
  });
  revalidateBranchRosterPaths();
  return { ok: true as const, id: data.id as string };
}

export type BranchRosterUpdate = BranchRosterFields & { id: string };

export async function saveBranchRosterUpdates(updates: BranchRosterUpdate[]) {
  const { email } = await requireAdmin();
  if (updates.length === 0) {
    return { ok: false as const, errors: ["No changes to save."] };
  }

  const service = await createServiceClient();

  for (const item of updates) {
    const validationError = validateBranchRosterFields(item);
    if (validationError) {
      return { ok: false as const, errors: [validationError] };
    }
    const row = branchRosterDbRow(item);
    const clash = await assertUniqueBranchCode(service, row.branch_code, item.id);
    if (clash) return { ok: false as const, errors: [clash] };

    const { error } = await service
      .from("branches")
      .update(row)
      .eq("id", item.id);

    if (error) return { ok: false as const, errors: [error.message] };
  }

  await logAudit(email, "update_branch", "branches", null, {
    count: updates.length,
    codes: updates.map((u) => normalizeBranchCode(u.branch_code)),
  });
  revalidateBranchRosterPaths();
  return { ok: true as const, count: updates.length };
}

export async function setBranchActive(branchId: string, is_active: boolean) {
  const { email } = await requireAdmin();
  const service = await createServiceClient();

  const { data: existing, error: loadError } = await service
    .from("branches")
    .select("id, branch_code, branch_name, is_active")
    .eq("id", branchId)
    .maybeSingle();

  if (loadError) return { ok: false as const, errors: [loadError.message] };
  if (!existing) {
    return { ok: false as const, errors: ["Branch not found."] };
  }

  const { error } = await service
    .from("branches")
    .update({ is_active })
    .eq("id", branchId);

  if (error) return { ok: false as const, errors: [error.message] };

  await logAudit(
    email,
    is_active ? "activate_branch" : "deactivate_branch",
    "branches",
    branchId,
    { branch_code: existing.branch_code }
  );
  revalidateBranchRosterPaths();
  return { ok: true as const };
}

export async function importRepresentativesFromCsv(csvText: string) {
  const { email } = await requireAdmin();

  if (!csvText?.trim()) {
    return { ok: false as const, errors: ["CSV file is empty."] };
  }

  const { rows, errors: parseErrors } = parseRepresentativesCsv(csvText);
  if (parseErrors.length) return { ok: false as const, errors: parseErrors };
  if (!rows.length) {
    return { ok: false as const, errors: ["No rows found in CSV."] };
  }

  const service = await createServiceClient();
  const { data: branches } = await service
    .from("branches")
    .select("id, branch_code");

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
        ok: false as const,
        errors: [e instanceof Error ? e.message : "Failed to import representatives"],
      };
    }
    updated++;
  }

  const resultErrors: string[] = [];
  if (notFound.length) {
    resultErrors.push(
      `Unknown branch_code (import branches first): ${notFound.slice(0, 5).join(", ")}${notFound.length > 5 ? ` (+${notFound.length - 5} more)` : ""}`
    );
  }

  await logAudit(email, "import_representatives", "branches", null, {
    updated,
    row_count: rows.length,
  });
  revalidatePath("/admin/national-competitions/representatives");
  revalidatePath("/admin/hris/employees");

  if (updated === 0) {
    return { ok: false as const, errors: resultErrors };
  }

  return {
    ok: true as const,
    count: updated,
    warnings: resultErrors,
    message: `Updated representatives for ${updated} branches.`,
  };
}

export async function importEmployeesFromCsv(csvText: string) {
  const { email } = await requireAdmin();

  if (!csvText?.trim()) {
    return { ok: false as const, errors: ["CSV file is empty."] };
  }

  const { rows, errors: parseErrors } = parseEmployeeDirectoryCsv(csvText);
  if (parseErrors.length) return { ok: false as const, errors: parseErrors };
  if (!rows.length) {
    return { ok: false as const, errors: ["No rows found in CSV."] };
  }

  const { importEmployeeDirectoryRows } = await import("@/lib/employees");
  const { upserted, errors } = await importEmployeeDirectoryRows(rows);

  await logAudit(email, "import_employees", "employees", null, {
    row_count: rows.length,
    upserted,
    error_count: errors.length,
  });
  revalidatePath("/admin/hris/employees");

  if (upserted === 0) {
    return { ok: false as const, errors: errors.length ? errors : ["No rows imported."] };
  }

  return {
    ok: true as const,
    count: upserted,
    warnings: errors.length ? errors : undefined,
    message: `Imported ${upserted} employee profile${upserted === 1 ? "" : "s"}.`,
  };
}

export async function saveRoundResults(
  roundId: string,
  results: Array<{
    branch_id: string;
    points: number;
    finish_order?: number | null;
  }>
) {
  const { email } = await requireAdmin();
  const service = await createServiceClient();

  const { data: round, error: roundErr } = await service
    .from("rounds")
    .select("round_number, seasons(slug)")
    .eq("id", roundId)
    .single();
  if (roundErr || !round) throw new Error("Round not found");

  const seasonRaw = round.seasons as { slug: SeasonSlug } | { slug: SeasonSlug }[];
  const seasonSlug = (Array.isArray(seasonRaw) ? seasonRaw[0] : seasonRaw).slug;

  for (const r of results) {
    const err = validateRoundPoints(seasonSlug, round.round_number, r.points);
    if (err) throw new Error(err);
    const orderErr = validateFinishOrder(
      seasonSlug,
      round.round_number,
      r.finish_order,
      r.points
    );
    if (orderErr) throw new Error(orderErr);
  }

  const payload = results.map((r) => ({
    round_id: roundId,
    branch_id: r.branch_id,
    points: r.points,
    wins: 0,
    losses: 0,
    finish_order: r.finish_order ?? null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await service.from("round_results").upsert(payload, {
    onConflict: "round_id,branch_id",
  });
  if (error) throw new Error(error.message);

  await logAudit(email, "save_round_results", "round", roundId, {
    count: results.length,
  });
  revalidatePath("/admin/national-competitions");
  revalidatePath("/admin");
  return { ok: true };
}

/** Zero all scores for a round; unpublished rounds stay draft-only on the public site. */
export async function clearRoundResults(roundId: string) {
  const { email } = await requireAdmin();
  const service = await createServiceClient();

  const { data: round, error: roundErr } = await service
    .from("rounds")
    .select("id, season_id, round_number, status, seasons(slug)")
    .eq("id", roundId)
    .single();
  if (roundErr || !round) throw new Error("Round not found");

  const seasonRaw = round.seasons as { slug: SeasonSlug } | { slug: SeasonSlug }[];
  const seasonSlug = (Array.isArray(seasonRaw) ? seasonRaw[0] : seasonRaw).slug;

  const now = new Date().toISOString();
  const { error: zeroErr } = await service
    .from("round_results")
    .update({
      points: 0,
      wins: 0,
      losses: 0,
      finish_order: null,
      updated_at: now,
    })
    .eq("round_id", roundId);
  if (zeroErr) throw new Error(zeroErr.message);

  const wasPublished = round.status === "published";

  if (wasPublished) {
    const { error: draftErr } = await service
      .from("rounds")
      .update({ status: "draft", published_at: null })
      .eq("id", roundId);
    if (draftErr) throw new Error(draftErr.message);

    await service
      .from("manual_round_advances")
      .delete()
      .eq("season_id", round.season_id)
      .eq("round_number", round.round_number);

    await recomputeAndPublishStandings(service, seasonSlug, round.season_id);
  }

  await logAudit(email, "clear_round_results", "round", roundId, {
    seasonSlug,
    roundNumber: round.round_number,
    revertedToDraft: wasPublished,
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/national-competitions");
  revalidatePath("/admin");
  return { ok: true, revertedToDraft: wasPublished };
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

  await assertSeasonParticipantsReady(service, round.season_id, seasonSlug);

  const { error: statusErr } = await service
    .from("rounds")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", roundId);
  if (statusErr) throw new Error(statusErr.message);

  await recomputeAndPublishStandings(service, seasonSlug, round.season_id);

  await logAudit(email, "publish_round", "round", roundId, { seasonSlug });
  revalidatePath("/", "layout");
  return { ok: true };
}

async function fetchManualAdvancesForSeason(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  seasonId: string
): Promise<ManualAdvance[]> {
  const { data, error } = await service
    .from("manual_round_advances")
    .select("round_number, region, branch_id")
    .eq("season_id", seasonId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    round_number: row.round_number,
    region: row.region as Region,
    branch_id: row.branch_id,
  }));
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
    .select("branch_id, points, wins, losses, finish_order, rounds(round_number)")
    .in("round_id", roundIds.length ? roundIds : ["00000000-0000-0000-0000-000000000000"]);

  const mapped = (results ?? []).map((r) => ({
    branch_id: r.branch_id,
    points: Number(r.points),
    wins: r.wins,
    losses: r.losses,
    finish_order: r.finish_order ?? null,
    round_number: (Array.isArray(r.rounds) ? r.rounds[0] : r.rounds)
      .round_number,
  }));

  const agg = aggregatePublishedResults(mapped);
  const publishedAt = new Date().toISOString();
  const publishedRoundNumbers = (publishedRounds ?? [])
    .map((r) => r.round_number)
    .sort((a, b) => a - b);

  const manualAdvances = await fetchManualAdvancesForSeason(service, seasonId);

  if (seasonSlug === "july_region" || seasonSlug === "june_area") {
    await service
      .from("published_standings")
      .delete()
      .eq("season_id", seasonId);

    for (const region of REGIONS) {
      const standings = computeStandings(
        seasonSlug,
        branchList ?? [],
        agg,
        { filterRegion: region, publishedRoundNumbers, manualAdvances }
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
    round1_points: s.round1_points ?? 0,
    round2_points: s.round2_points ?? 0,
    round3_points: s.round3_points ?? 0,
    total_wins: s.total_wins,
    status: s.status,
    region_filter: region,
    published_at: publishedAt,
    eliminated_in_round: s.eliminated_in_round ?? null,
    tie_breaker_in_round: s.tie_breaker_in_round ?? null,
    last_active_round: s.last_active_round ?? 0,
    round3_finish_order: s.round3_finish_order ?? null,
    manually_advanced_after_round: s.manually_advanced_after_round ?? null,
  }));
  const { error } = await service.from("published_standings").insert(rows);
  if (error) throw new Error(error.message);
}

async function getParticipantBranchIds(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  seasonId: string,
  seasonSlug: SeasonSlug
) {
  return resolveParticipantBranchIds(service, seasonId, seasonSlug);
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

  const { data: r3 } = await service
    .from("rounds")
    .select("status")
    .eq("season_id", season.id)
    .eq("round_number", 3)
    .maybeSingle();
  if (r3?.status !== "published") {
    throw new Error("Publish Round 3 for this phase before locking.");
  }

  await service.from("phase_locks").upsert({
    season_id: season.id,
    locked_by_email: email,
    locked_at: new Date().toISOString(),
  });

  if (seasonSlug === "june_area") {
    const { data: top } = await service
      .from("published_standings")
      .select("branch_id")
      .eq("season_id", season.id)
      .eq("status", "advanced");

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

export interface DraftPreviewResult {
  seasonSlug: SeasonSlug;
  rows: StandingRow[];
  byRegion?: Partial<Record<Region, StandingRow[]>>;
}

export async function previewDraftStandings(
  roundId: string,
  draftResults: Array<{
    branch_id: string;
    points: number;
    finish_order?: number | null;
  }>
): Promise<DraftPreviewResult> {
  await requireAdmin();
  const service = await createServiceClient();

  const { data: round, error: roundErr } = await service
    .from("rounds")
    .select("id, season_id, round_number, seasons(slug)")
    .eq("id", roundId)
    .single();
  if (roundErr || !round) throw new Error("Round not found");

  const seasonRaw = round.seasons as { slug: SeasonSlug } | { slug: SeasonSlug }[];
  const seasonSlug = (Array.isArray(seasonRaw) ? seasonRaw[0] : seasonRaw).slug;

  const participantIds = await getParticipantBranchIds(
    service,
    round.season_id,
    seasonSlug
  );

  let branchQuery = service
    .from("branches")
    .select(
      "id, branch_code, branch_name, area, region, representative_1, representative_2, representative_1_employee_no, representative_1_position, representative_2_employee_no, representative_2_position"
    );
  if (participantIds.length > 0) {
    branchQuery = branchQuery.in("id", participantIds);
  }
  const { data: branchList } = await branchQuery;

  const { data: seasonRounds } = await service
    .from("rounds")
    .select("id, round_number, status")
    .eq("season_id", round.season_id);

  const includedRoundIds = (seasonRounds ?? [])
    .filter((r) => r.status === "published" || r.id === roundId)
    .map((r) => r.id);

  const { data: dbResults } = await service
    .from("round_results")
    .select(
      "branch_id, points, wins, losses, finish_order, round_id, rounds(round_number)"
    )
    .in(
      "round_id",
      includedRoundIds.length
        ? includedRoundIds
        : ["00000000-0000-0000-0000-000000000000"]
    );

  const mapped = (dbResults ?? [])
    .filter((r) => {
      const roundMeta = Array.isArray(r.rounds) ? r.rounds[0] : r.rounds;
      return r.round_id !== roundId && roundMeta;
    })
    .map((r) => {
      const roundMeta = Array.isArray(r.rounds) ? r.rounds[0] : r.rounds;
      return {
        branch_id: r.branch_id,
        points: Number(r.points),
        wins: r.wins,
        losses: r.losses,
        finish_order: r.finish_order ?? null,
        round_number: roundMeta.round_number,
      };
    });

  for (const draft of draftResults) {
    mapped.push({
      branch_id: draft.branch_id,
      points: draft.points,
      wins: 0,
      losses: 0,
      round_number: round.round_number,
      finish_order: draft.finish_order ?? null,
    });
  }

  const agg = aggregatePublishedResults(mapped);
  const publishedRoundNumbers = (seasonRounds ?? [])
    .filter((r) => r.status === "published" || r.id === roundId)
    .map((r) => r.round_number)
    .sort((a, b) => a - b);

  const attachReps = (rows: StandingRow[]): StandingRow[] => {
    const byId = new Map((branchList ?? []).map((b) => [b.id, b]));
    return rows.map((row) => {
      const b = byId.get(row.branch_id);
      return {
        ...row,
        representative_1: b?.representative_1 ?? null,
        representative_2: b?.representative_2 ?? null,
        representative_1_employee_no: b?.representative_1_employee_no ?? null,
        representative_1_position: b?.representative_1_position ?? null,
        representative_2_employee_no: b?.representative_2_employee_no ?? null,
        representative_2_position: b?.representative_2_position ?? null,
      };
    });
  };

  const branchInputs =
    branchList?.map((b) => ({
      id: b.id,
      branch_code: b.branch_code,
      branch_name: b.branch_name,
      area: b.area,
      region: b.region as Region,
    })) ?? [];

  const manualAdvances = await fetchManualAdvancesForSeason(
    service,
    round.season_id
  );

  if (seasonSlug === "july_region" || seasonSlug === "june_area") {
    const byRegion: Partial<Record<Region, StandingRow[]>> = {};
    for (const region of REGIONS) {
      byRegion[region] = attachReps(
        computeStandings(seasonSlug, branchInputs, agg, {
          filterRegion: region,
          publishedRoundNumbers,
          manualAdvances,
        })
      );
    }
    return {
      seasonSlug,
      rows: byRegion.luzon ?? [],
      byRegion,
    };
  }

  const rows = attachReps(
    computeStandings(seasonSlug, branchInputs, agg, { publishedRoundNumbers })
  );
  return { seasonSlug, rows };
}

type ManualAdvanceContext = {
  service: Awaited<ReturnType<typeof createServiceClient>>;
  email: string;
  round: {
    id: string;
    season_id: string;
    round_number: number;
    status: string;
  };
  seasonSlug: SeasonSlug;
  branchInputs: Array<{
    id: string;
    branch_code: string;
    branch_name: string;
    area: string;
    region: Region;
  }>;
  publishedRoundNumbers: number[];
  agg: ReturnType<typeof aggregatePublishedResults>;
};

async function loadManualAdvanceContext(
  roundId: string
): Promise<ManualAdvanceContext> {
  const { email } = await requireAdmin();
  const service = await createServiceClient();

  const { data: round, error: roundErr } = await service
    .from("rounds")
    .select("id, season_id, round_number, status, seasons(slug)")
    .eq("id", roundId)
    .single();
  if (roundErr || !round) throw new Error("Round not found");
  if (round.status !== "published") {
    throw new Error("Publish this round before managing advancement picks.");
  }

  const seasonRaw = round.seasons as { slug: SeasonSlug } | { slug: SeasonSlug }[];
  const seasonSlug = (Array.isArray(seasonRaw) ? seasonRaw[0] : seasonRaw).slug;
  if (seasonSlug !== "june_area" && seasonSlug !== "july_region") {
    throw new Error("Manual advancement picks are only for June and July.");
  }

  const participantIds = await getParticipantBranchIds(
    service,
    round.season_id,
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
  const branchInputs =
    branchList?.map((b) => ({
      id: b.id,
      branch_code: b.branch_code,
      branch_name: b.branch_name,
      area: b.area,
      region: b.region as Region,
    })) ?? [];

  return {
    service,
    email,
    round,
    seasonSlug,
    branchInputs,
    publishedRoundNumbers,
    agg,
  };
}

async function persistRegionManualAdvances(
  ctx: ManualAdvanceContext,
  region: Region,
  branchIds: string[]
) {
  const autoOnly = computeStandings(ctx.seasonSlug, ctx.branchInputs, ctx.agg, {
    filterRegion: region,
    publishedRoundNumbers: ctx.publishedRoundNumbers,
    manualAdvances: [],
  });

  const eligibleToPick = new Set(
    autoOnly
      .filter(
        (r) =>
          r.eliminated_in_round === ctx.round.round_number ||
          r.tie_breaker_in_round === ctx.round.round_number
      )
      .map((r) => r.branch_id)
  );

  for (const branchId of branchIds) {
    const branch = ctx.branchInputs.find((b) => b.id === branchId);
    if (!branch || branch.region !== region) {
      throw new Error("Invalid branch for this region.");
    }
    if (!eligibleToPick.has(branchId)) {
      throw new Error(
        `${branch.branch_name} is not eligible for extra advancement after this round.`
      );
    }
  }

  await ctx.service
    .from("manual_round_advances")
    .delete()
    .eq("season_id", ctx.round.season_id)
    .eq("round_number", ctx.round.round_number)
    .eq("region", region);

  if (branchIds.length > 0) {
    const { error: insertErr } = await ctx.service
      .from("manual_round_advances")
      .insert(
        branchIds.map((branch_id) => ({
          season_id: ctx.round.season_id,
          round_number: ctx.round.round_number,
          region,
          branch_id,
          created_by_email: ctx.email,
        }))
      );
    if (insertErr) throw new Error(insertErr.message);
  }
}

async function finalizeManualAdvances(
  ctx: ManualAdvanceContext,
  roundId: string,
  auditDetail: Record<string, unknown>
) {
  await recomputeAndPublishStandings(
    ctx.service,
    ctx.seasonSlug,
    ctx.round.season_id
  );

  await logAudit(ctx.email, "save_manual_advances", "round", roundId, auditDetail);

  revalidatePath("/", "layout");
  revalidatePath("/admin/national-competitions");
  revalidatePath("/admin");
}

export async function saveManualAdvances(
  roundId: string,
  region: Region,
  branchIds: string[]
) {
  const ctx = await loadManualAdvanceContext(roundId);
  await persistRegionManualAdvances(ctx, region, branchIds);
  await finalizeManualAdvances(ctx, roundId, {
    region,
    count: branchIds.length,
    roundNumber: ctx.round.round_number,
  });
  return { ok: true };
}

export async function saveManualAdvancesAll(
  roundId: string,
  picksByRegion: Record<Region, string[]>
) {
  const ctx = await loadManualAdvanceContext(roundId);
  const counts: Record<Region, number> = { luzon: 0, ncr: 0, vismin: 0 };

  for (const region of REGIONS) {
    const branchIds = picksByRegion[region] ?? [];
    await persistRegionManualAdvances(ctx, region, branchIds);
    counts[region] = branchIds.length;
  }

  await finalizeManualAdvances(ctx, roundId, {
    allRegions: true,
    counts,
    roundNumber: ctx.round.round_number,
  });
  return { ok: true };
}

export async function saveMechanicsContent(body: MechanicsPublicBody) {
  const { email } = await requireAdmin();
  const service = await createServiceClient();

  const payload = {
    intro: body.intro ?? "",
    announcements: body.announcements ?? "",
    custom_sections: body.custom_sections ?? [],
  };

  const { error } = await service.from("site_content").upsert(
    {
      slug: MECHANICS_CONTENT_SLUG,
      body: payload,
      updated_at: new Date().toISOString(),
      updated_by_email: email,
    },
    { onConflict: "slug" }
  );

  if (error) throw new Error(error.message);

  await logAudit(email, "save_mechanics_content", "site_content", MECHANICS_CONTENT_SLUG, {
    sections: payload.custom_sections.length,
  });

  revalidatePath("/mechanics");
  revalidatePath("/admin/national-competitions/mechanics");
  return { ok: true };
}

export async function saveEventSchedule(
  config: import("@/lib/event-schedule").EventScheduleConfig
) {
  const { email } = await requireAdmin();
  const service = await createServiceClient();
  const { EVENT_SCHEDULE_SLUG, prunePastScheduleEntries } = await import(
    "@/lib/event-schedule"
  );

  const { config: pruned, removed } = prunePastScheduleEntries(config);

  const payload = {
    entries: pruned.entries.map((e) => ({
      id: e.id,
      program: e.program,
      title: e.title.trim(),
      scheduledAt: e.scheduledAt,
      ...(e.area ? { area: e.area } : {}),
    })),
  };

  const { error } = await service.from("site_content").upsert(
    {
      slug: EVENT_SCHEDULE_SLUG,
      body: payload,
      updated_at: new Date().toISOString(),
      updated_by_email: email,
    },
    { onConflict: "slug" }
  );

  if (error) throw new Error(error.message);

  await logAudit(
    email,
    "save_event_schedule",
    "site_content",
    EVENT_SCHEDULE_SLUG,
    { count: payload.entries.length, removed }
  );

  revalidatePath("/");
  revalidatePath("/admin/national-competitions/competition");
  return { ok: true, removed, config: pruned };
}

export async function saveNcPhaseSchedules(
  config: import("@/lib/nc-phase-schedules").NcPhaseSchedulesConfig
) {
  const { email } = await requireAdmin();
  const service = await createServiceClient();
  const { NC_PHASE_SCHEDULES_SLUG } = await import("@/lib/nc-phase-schedules");

  const { error } = await service.from("site_content").upsert(
    {
      slug: NC_PHASE_SCHEDULES_SLUG,
      body: config,
      updated_at: new Date().toISOString(),
      updated_by_email: email,
    },
    { onConflict: "slug" }
  );

  if (error) throw new Error(error.message);

  await logAudit(
    email,
    "save_nc_phase_schedules",
    "site_content",
    NC_PHASE_SCHEDULES_SLUG,
    {}
  );

  revalidatePath("/");
  revalidatePath("/admin/national-competitions/competition");
  return { ok: true };
}

export async function saveSiteHomeConfig(
  config: import("@/lib/site-home-config").SiteHomeConfig
) {
  const { email } = await requireAdmin();
  const service = await createServiceClient();
  const { SITE_HOME_CONFIG_SLUG } = await import("@/lib/site-home-config");

  const payload = {
    featuredProgram: config.featuredProgram,
    heroHeadlineOverride: config.heroHeadlineOverride ?? "",
    heroSublineOverride: config.heroSublineOverride ?? "",
  };

  const { error } = await service.from("site_content").upsert(
    {
      slug: SITE_HOME_CONFIG_SLUG,
      body: payload,
      updated_at: new Date().toISOString(),
      updated_by_email: email,
    },
    { onConflict: "slug" }
  );

  if (error) throw new Error(error.message);

  await logAudit(
    email,
    "save_site_home_config",
    "site_content",
    SITE_HOME_CONFIG_SLUG,
    { featuredProgram: payload.featuredProgram }
  );

  revalidatePath("/");
  revalidatePath("/admin/national-competitions/competition");
  return { ok: true };
}

export async function saveCompetitionMap(config: CompetitionMapConfig) {
  const { email } = await requireAdmin();
  const service = await createServiceClient();

  const payload = {
    milestoneId: config.milestoneId,
    regionHighlight: config.regionHighlight,
    publicCaption: config.publicCaption ?? "",
    showContestantList: config.showContestantList ?? true,
  };

  const { error } = await service.from("site_content").upsert(
    {
      slug: COMPETITION_MAP_SLUG,
      body: payload,
      updated_at: new Date().toISOString(),
      updated_by_email: email,
    },
    { onConflict: "slug" }
  );

  if (error) throw new Error(error.message);

  await logAudit(
    email,
    "save_competition_map",
    "site_content",
    COMPETITION_MAP_SLUG,
    { milestoneId: payload.milestoneId }
  );

  revalidatePath("/");
  revalidatePath("/admin/national-competitions/competition");
  return { ok: true };
}

/** Pre-fill editor from latest published round across all phases (best-effort). */
export async function suggestCompetitionMilestone(): Promise<{
  milestoneId: CompetitionMilestoneId;
  publicCaption: string;
}> {
  await requireAdmin();

  const june = await getSeasonBySlug("june_area");
  const july = await getSeasonBySlug("july_region");
  const august = await getSeasonBySlug("august_finals");

  const juneRound = june ? await getLatestPublishedRoundNumber(june.id) : 0;
  const julyRound = july ? await getLatestPublishedRoundNumber(july.id) : 0;
  const augustRound = august
    ? await getLatestPublishedRoundNumber(august.id)
    : 0;

  if (juneRound <= 0 && julyRound <= 0 && augustRound <= 0) {
    return {
      milestoneId: "pre_season",
      publicCaption: "Competition has not started yet — publish Round 1 when ready.",
    };
  }

  if (juneRound >= 3 && julyRound <= 0) {
    return {
      milestoneId: "june_to_july",
      publicCaption:
        "You are here: June complete — July regional phase starting. Update caption when July R1 is published.",
    };
  }

  if (julyRound >= 3 && augustRound <= 0) {
    return {
      milestoneId: "july_to_august",
      publicCaption:
        "You are here: July complete — The Nationals starting. Update caption when Nationals Round 1 is published.",
    };
  }

  if (augustRound >= 3) {
    return {
      milestoneId: "complete",
      publicCaption: "Competition complete — thank all branches for a great season.",
    };
  }

  const latest = await getLatestPublishedRoundInfo();
  if (!latest) {
    return {
      milestoneId: "pre_season",
      publicCaption: "No published rounds found yet.",
    };
  }

  const { seasonSlug, roundNumber: round } = latest;
  const r = Math.min(round, 3);

  if (seasonSlug === "june_area") {
    const ids: Record<number, CompetitionMilestoneId> = {
      1: "june_r1",
      2: "june_r2",
      3: "june_r3",
    };
    const milestoneId = ids[r] ?? "june_r3";
    return {
      milestoneId,
      publicCaption: `You are here: after June Round ${round} — check regional standings for who advances.`,
    };
  }

  if (seasonSlug === "july_region") {
    const ids: Record<number, CompetitionMilestoneId> = {
      1: "july_r1",
      2: "july_r2",
      3: "july_r3",
    };
    const milestoneId = ids[r] ?? "july_r3";
    return {
      milestoneId,
      publicCaption: `You are here: after July Round ${round} — regional boards show survivors.`,
    };
  }

  const ids: Record<number, CompetitionMilestoneId> = {
    1: "august_r1",
    2: "august_r2",
    3: "august_r3",
  };
  const milestoneId = ids[r] ?? "august_r3";
  return {
    milestoneId,
    publicCaption: `You are here: after Nationals Round ${round} — standings on The Nationals board.`,
  };
}

const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const LOGO_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

/** Home uses ISR — revalidate public paths after branding uploads. */
function scheduleBrandingRevalidation() {
  after(() => {
    try {
      revalidateBrandingPublicPaths();
    } catch {
      // non-fatal
    }
  });
}

async function upsertBrandingBody(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  email: string,
  patch: Partial<BrandingConfig>
) {
  const { data: existing } = await service
    .from("site_content")
    .select("body")
    .eq("slug", BRANDING_CONTENT_SLUG)
    .maybeSingle();

  const current = existing?.body
    ? parseBrandingBody(existing.body)
    : { ...DEFAULT_BRANDING };

  const body: BrandingConfig = finalizeBrandingConfig({
    logo_url: patch.logo_url !== undefined ? patch.logo_url : current.logo_url,
    logo_alt: patch.logo_alt ?? current.logo_alt ?? DEFAULT_BRANDING.logo_alt,
    carousel_slides:
      patch.carousel_slides !== undefined
        ? patch.carousel_slides
        : current.carousel_slides,
    sponsor_logos:
      patch.sponsor_logos !== undefined
        ? patch.sponsor_logos
        : current.sponsor_logos,
  });

  const { error } = await service.from("site_content").upsert(
    {
      slug: BRANDING_CONTENT_SLUG,
      body,
      updated_at: new Date().toISOString(),
      updated_by_email: email,
    },
    { onConflict: "slug" }
  );
  if (error) throw new Error(error.message);
  return body;
}

export async function uploadBrandingLogo(formData: FormData) {
  const { email } = await requireAdmin();
  const service = await createServiceClient();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose an image file to upload.");
  }
  if (file.size > LOGO_MAX_BYTES) {
    throw new Error("Logo must be 2MB or smaller.");
  }
  const ext = LOGO_MIME[file.type];
  if (!ext) {
    throw new Error("Use PNG, JPG, WebP, or SVG.");
  }

  const path = `logo.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await removeBrandingStorageFiles(service, "logo.");

  const { error: uploadErr } = await service.storage
    .from("branding")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });
  if (uploadErr) throw new Error(uploadErr.message);

  const logoUrl = brandingAssetUrl(path);

  await upsertBrandingBody(service, email, { logo_url: logoUrl });

  await logAudit(email, "upload_branding_logo", "site_content", BRANDING_CONTENT_SLUG, {
    path,
  });

  scheduleBrandingRevalidation();
  return { ok: true, logo_url: logoUrl };
}

async function removeBrandingStorageFiles(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  prefix: string
) {
  const { data: list } = await service.storage.from("branding").list("", {
    limit: 20,
  });
  const toRemove =
    list?.filter((o) => o.name.startsWith(prefix)).map((o) => o.name) ?? [];
  if (toRemove.length) {
    await service.storage.from("branding").remove(toRemove);
  }
}

export async function removeBrandingLogo() {
  const { email } = await requireAdmin();
  const service = await createServiceClient();

  await removeBrandingStorageFiles(service, "logo.");

  await upsertBrandingBody(service, email, { logo_url: null });

  await logAudit(email, "remove_branding_logo", "site_content", BRANDING_CONTENT_SLUG, {});

  scheduleBrandingRevalidation();
  return { ok: true };
}

export async function saveBrandingAlt(logoAlt: string) {
  const { email } = await requireAdmin();
  const service = await createServiceClient();
  await upsertBrandingBody(service, email, {
    logo_alt: logoAlt.trim() || DEFAULT_BRANDING.logo_alt,
  });
  scheduleBrandingRevalidation();
  return { ok: true };
}

export async function refreshBrandingConfig(): Promise<BrandingConfig> {
  await requireAdmin();
  return getBranding();
}

export async function uploadCarouselSlide(formData: FormData) {
  const { email } = await requireAdmin();
  const file = formData.get("file");
  const slot = parseCarouselSlot(formData.get("slot"));
  if (!(file instanceof File)) {
    throw new Error("Choose an image file to upload.");
  }
  const result = await uploadCarouselSlideFile(email, slot, file);
  await logAudit(email, "upload_carousel_slide", "site_content", BRANDING_CONTENT_SLUG, {
    slot,
  });
  return result;
}

export async function removeCarouselSlide(slot: import("@/lib/branding").CarouselSlot) {
  const { email } = await requireAdmin();
  const result = await removeCarouselSlideSlot(email, slot);
  await logAudit(email, "remove_carousel_slide", "site_content", BRANDING_CONTENT_SLUG, {
    slot,
  });
  return result;
}
