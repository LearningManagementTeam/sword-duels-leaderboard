import type {
  Employee,
  EmployeeAdminRow,
  EmployeePickerRow,
  EmployeeRepAssignment,
  EmploymentStatus,
} from "@/lib/employee-types";
import type { RepresentativeSavePayload } from "@/lib/representative-fields";
import { createServiceClient } from "@/lib/supabase/server";
import {
  applyHrisFieldsToPayload,
  type EmployeeHrisProfileFields,
} from "@/lib/employee-profile-fields";
import { findEmployeeDirectoryDuplicateMessage } from "@/lib/employee-directory-duplicate";
import {
  legacyEmployeeNo,
  provisionalEmployeeNo,
} from "@/lib/employee-numbers";
import { normalizeAllCapsText } from "@/lib/text-format";

export { legacyEmployeeNo, provisionalEmployeeNo } from "@/lib/employee-numbers";

export type {
  Employee,
  EmployeeAdminRow,
  EmployeeRepAssignment,
  EmploymentStatus,
} from "@/lib/employee-types";
export { employmentStatusLabel } from "@/lib/employee-types";

export interface RepSlotInput extends EmployeeHrisProfileFields {
  full_name: string;
  employee_no: string;
  position: string;
  home_branch_id?: string | null;
}

const EMPLOYEE_COLUMNS =
  "id, employee_no, full_name, position, nickname, date_hired, contact_number, email, employment_status, resigned_at, notes, photo_path, home_branch_id, created_at, updated_at";

function employeeWritePayload(
  input: RepSlotInput | (EmployeeHrisProfileFields & {
    full_name: string;
    employee_no: string;
    position?: string;
    notes?: string;
    home_branch_id?: string | null;
  }),
  options?: { mergeHris?: boolean }
): Record<string, unknown> {
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    full_name: normalizeAllCapsText(input.full_name.trim()),
    updated_at: now,
  };

  if (input.position !== undefined) {
    payload.position = normalizeAllCapsText(input.position.trim()) || null;
  }

  if ("notes" in input && input.notes !== undefined) {
    payload.notes = input.notes?.trim()
      ? normalizeAllCapsText(input.notes.trim()) || null
      : null;
  }

  if (input.home_branch_id !== undefined) {
    payload.home_branch_id = input.home_branch_id?.trim() || null;
  }

  if (options?.mergeHris !== false) {
    applyHrisFieldsToPayload(payload, input);
  }

  return payload;
}

export function normalizeEmployeeNo(value: string): string {
  return value.trim();
}

async function assertEmployeeDirectoryUnique(
  fields: { employee_no: string; full_name: string },
  excludeEmployeeId?: string
): Promise<void> {
  const service = await createServiceClient();
  const { data, error } = await service
    .from("employees")
    .select("id, employee_no, full_name");

  if (error) {
    throw new Error(error.message ?? "Could not verify employee directory.");
  }

  const message = findEmployeeDirectoryDuplicateMessage(
    data ?? [],
    fields,
    excludeEmployeeId
  );
  if (message) throw new Error(message);
}

function slotInputFromPayload(
  payload: RepresentativeSavePayload,
  slot: 1 | 2,
  branchCode: string
): RepSlotInput | null {
  const name =
    slot === 1 ? payload.representative_1 : payload.representative_2;
  const employeeNo =
    slot === 1
      ? payload.representative_1_employee_no
      : payload.representative_2_employee_no;
  const position =
    slot === 1
      ? payload.representative_1_position
      : payload.representative_2_position;

  const fullName = name?.trim() ?? "";
  const no = employeeNo?.trim() ?? "";

  if (!fullName && !no) return null;

  const nickname =
    slot === 1 ? payload.representative_1_nickname : payload.representative_2_nickname;
  const date_hired =
    slot === 1 ? payload.representative_1_date_hired : payload.representative_2_date_hired;
  const contact_number =
    slot === 1
      ? payload.representative_1_contact_number
      : payload.representative_2_contact_number;
  const email =
    slot === 1 ? payload.representative_1_email : payload.representative_2_email;

  const result: RepSlotInput = {
    full_name: fullName || no,
    employee_no: no || legacyEmployeeNo(branchCode, slot),
    position: position?.trim() ?? "",
  };

  if (nickname !== undefined) result.nickname = nickname;
  if (date_hired !== undefined) result.date_hired = date_hired;
  if (contact_number !== undefined) result.contact_number = contact_number;
  if (email !== undefined) result.email = email;

  return result;
}

async function findEmployeeByEmployeeNoInService(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  employeeNo: string
): Promise<Employee | null> {
  const normalized = normalizeEmployeeNo(employeeNo);
  if (!normalized) return null;

  const { data: exact } = await service
    .from("employees")
    .select(EMPLOYEE_COLUMNS)
    .eq("employee_no", normalized)
    .maybeSingle();
  if (exact) return exact as Employee;

  const { data: insensitive } = await service
    .from("employees")
    .select(EMPLOYEE_COLUMNS)
    .ilike("employee_no", normalized)
    .maybeSingle();

  return (insensitive as Employee) ?? null;
}

/** Prefer an existing HRIS directory row when employee_no matches; merge profile fields. */
async function resolveEmployeeForRepSlot(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  input: RepSlotInput
): Promise<Employee> {
  return upsertEmployeeFromRepSlot(service, input);
}

export async function upsertEmployeeFromRepSlot(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  input: RepSlotInput
): Promise<Employee> {
  const employeeNo = normalizeEmployeeNo(input.employee_no);
  const now = new Date().toISOString();

  const existing = await findEmployeeByEmployeeNoInService(service, employeeNo);

  if (existing) {
    const { data, error } = await service
      .from("employees")
      .update(employeeWritePayload(input))
      .eq("id", existing.id)
      .select(EMPLOYEE_COLUMNS)
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to update employee profile");
    }
    return data as Employee;
  }

  if (employeeNo && !employeeNo.startsWith("LEGACY-")) {
    throw new Error(
      `Employee no. ${employeeNo} is not in the directory. Add them in HRIS → Employee directory first.`
    );
  }

  const { data, error } = await service
    .from("employees")
    .insert({
      employee_no: employeeNo,
      ...employeeWritePayload(input),
      employment_status: "active",
      updated_at: now,
    })
    .select(EMPLOYEE_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create employee profile");
  }

  return data as Employee;
}

function denormalizedRepColumns(
  slot: 1 | 2,
  employee: Employee | null
): Record<string, string | null> {
  if (slot === 1) {
    return {
      representative_1: employee?.full_name ?? null,
      representative_1_employee_no: employee?.employee_no ?? null,
      representative_1_position: employee?.position ?? null,
      representative_1_employee_id: employee?.id ?? null,
    };
  }
  return {
    representative_2: employee?.full_name ?? null,
    representative_2_employee_no: employee?.employee_no ?? null,
    representative_2_position: employee?.position ?? null,
    representative_2_employee_id: employee?.id ?? null,
  };
}

function repSlotWithHomeBranch(
  input: RepSlotInput | null,
  branchId: string
): RepSlotInput | null {
  if (!input) return null;
  return {
    ...input,
    home_branch_id: input.home_branch_id ?? branchId,
  };
}

export async function linkBranchRepresentatives(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  branchId: string,
  branchCode: string,
  slots: { slot1: RepSlotInput | null; slot2: RepSlotInput | null },
  updatedAt?: string
): Promise<void> {
  const now = updatedAt ?? new Date().toISOString();

  const emp1 = slots.slot1
    ? await resolveEmployeeForRepSlot(
        service,
        repSlotWithHomeBranch(slots.slot1, branchId)!
      )
    : null;
  const emp2 = slots.slot2
    ? await resolveEmployeeForRepSlot(
        service,
        repSlotWithHomeBranch(slots.slot2, branchId)!
      )
    : null;

  const { error } = await service
    .from("branches")
    .update({
      ...denormalizedRepColumns(1, emp1),
      ...denormalizedRepColumns(2, emp2),
      representatives_updated_at: now,
    })
    .eq("id", branchId);

  if (error) throw new Error(error.message);
}

export async function linkBranchRepresentativesFromPayload(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  branchId: string,
  branchCode: string,
  payload: Omit<RepresentativeSavePayload, "branch_id">,
  updatedAt?: string
): Promise<void> {
  await linkBranchRepresentatives(
    service,
    branchId,
    branchCode,
    {
      slot1: slotInputFromPayload(
        { ...payload, branch_id: branchId },
        1,
        branchCode
      ),
      slot2: slotInputFromPayload(
        { ...payload, branch_id: branchId },
        2,
        branchCode
      ),
    },
    updatedAt
  );
}

const BRANCH_REP_ASSIGN_SELECT =
  "id, branch_code, representative_1_employee_id, representative_2_employee_id";

function repSlotInputFromEmployee(employee: Employee): RepSlotInput {
  return {
    full_name: employee.full_name,
    employee_no: employee.employee_no,
    position: employee.position ?? "",
    nickname: employee.nickname,
    date_hired: employee.date_hired,
    contact_number: employee.contact_number,
    email: employee.email,
    home_branch_id: employee.home_branch_id,
  };
}

async function linkBranchRepSlotsByEmployeeIds(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  branchId: string,
  branchCode: string,
  slot1Id: string | null,
  slot2Id: string | null,
  updatedAt?: string
): Promise<void> {
  const empById = await loadEmployeesByIds(
    [slot1Id, slot2Id].filter(Boolean) as string[]
  );

  await linkBranchRepresentatives(
    service,
    branchId,
    branchCode,
    {
      slot1: slot1Id
        ? repSlotInputFromEmployee(empById.get(slot1Id)!)
        : null,
      slot2: slot2Id
        ? repSlotInputFromEmployee(empById.get(slot2Id)!)
        : null,
    },
    updatedAt
  );
}

/** Assign a directory employee to Rep 1 or Rep 2 on a branch (max two reps per branch). */
export async function assignEmployeeToBranchRepSlot(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  employeeId: string,
  branchId: string,
  slot: 1 | 2,
  updatedAt?: string
): Promise<void> {
  const { data: employeeRow, error: empError } = await service
    .from("employees")
    .select(EMPLOYEE_COLUMNS)
    .eq("id", employeeId)
    .maybeSingle();

  if (empError || !employeeRow) {
    throw new Error("Employee not found.");
  }

  const employee = employeeRow as Employee;
  if (employee.employment_status === "resigned") {
    throw new Error("Cannot assign a resigned employee as a competition rep.");
  }

  const { data: branchRow, error: branchError } = await service
    .from("branches")
    .select(BRANCH_REP_ASSIGN_SELECT)
    .eq("id", branchId)
    .maybeSingle();

  if (branchError || !branchRow) {
    throw new Error("Branch not found.");
  }

  const branchCode = branchRow.branch_code as string;
  let slot1Id = branchRow.representative_1_employee_id as string | null;
  let slot2Id = branchRow.representative_2_employee_id as string | null;

  if (slot1Id === employeeId) slot1Id = null;
  if (slot2Id === employeeId) slot2Id = null;

  if (slot === 1) slot1Id = employeeId;
  else slot2Id = employeeId;

  await linkBranchRepSlotsByEmployeeIds(
    service,
    branchId,
    branchCode,
    slot1Id,
    slot2Id,
    updatedAt
  );
}

/** Remove an employee from whichever rep slot they hold on a branch. */
export async function clearEmployeeFromBranchRep(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  employeeId: string,
  branchId: string,
  updatedAt?: string
): Promise<void> {
  const { data: branchRow, error: branchError } = await service
    .from("branches")
    .select(BRANCH_REP_ASSIGN_SELECT)
    .eq("id", branchId)
    .maybeSingle();

  if (branchError || !branchRow) {
    throw new Error("Branch not found.");
  }

  const branchCode = branchRow.branch_code as string;
  let slot1Id = branchRow.representative_1_employee_id as string | null;
  let slot2Id = branchRow.representative_2_employee_id as string | null;

  if (slot1Id !== employeeId && slot2Id !== employeeId) {
    throw new Error("This employee is not assigned as a rep for that branch.");
  }

  if (slot1Id === employeeId) slot1Id = null;
  if (slot2Id === employeeId) slot2Id = null;

  await linkBranchRepSlotsByEmployeeIds(
    service,
    branchId,
    branchCode,
    slot1Id,
    slot2Id,
    updatedAt
  );
}

export async function resolveEmployeeIdForRepSlot(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  branchId: string,
  slot: 1 | 2
): Promise<string | null> {
  const col =
    slot === 2 ? "representative_2_employee_id" : "representative_1_employee_id";
  const { data } = await service
    .from("branches")
    .select(col)
    .eq("id", branchId)
    .maybeSingle();

  if (!data) return null;
  return (data as Record<string, string | null>)[col];
}

export async function loadEmployeesByIds(
  ids: string[]
): Promise<Map<string, Employee>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const service = await createServiceClient();
  const { data } = await service
    .from("employees")
    .select(EMPLOYEE_COLUMNS)
    .in("id", unique);

  return new Map((data ?? []).map((row) => [row.id, row as Employee]));
}

export async function enrichBranchesWithRepEmployees<
  T extends {
    id: string;
    representative_1_employee_id?: string | null;
    representative_2_employee_id?: string | null;
  },
>(branches: T[]): Promise<
  (T & {
    representative_1_employment_status?: EmploymentStatus | null;
    representative_2_employment_status?: EmploymentStatus | null;
    representative_1_photo_path?: string | null;
    representative_2_photo_path?: string | null;
  })[]
> {
  const ids = branches.flatMap((b) => [
    b.representative_1_employee_id,
    b.representative_2_employee_id,
  ]);
  const byId = await loadEmployeesByIds(
    ids.filter((id): id is string => Boolean(id))
  );

  return branches.map((b) => {
    const e1 = b.representative_1_employee_id
      ? byId.get(b.representative_1_employee_id)
      : null;
    const e2 = b.representative_2_employee_id
      ? byId.get(b.representative_2_employee_id)
      : null;
    return {
      ...b,
      representative_1_employment_status: e1?.employment_status ?? null,
      representative_2_employment_status: e2?.employment_status ?? null,
      representative_1_photo_path: e1?.photo_path ?? null,
      representative_2_photo_path: e2?.photo_path ?? null,
      representative_1_nickname: e1?.nickname ?? null,
      representative_1_date_hired: e1?.date_hired ?? null,
      representative_1_contact_number: e1?.contact_number ?? null,
      representative_1_email: e1?.email ?? null,
      representative_2_nickname: e2?.nickname ?? null,
      representative_2_date_hired: e2?.date_hired ?? null,
      representative_2_contact_number: e2?.contact_number ?? null,
      representative_2_email: e2?.email ?? null,
    };
  });
}

export interface GetEmployeesForAdminOptions {
  search?: string;
  status?: EmploymentStatus | "all";
  branchId?: string;
}

/** Rep slots this employee holds across all branches. */
export async function getEmployeeRepAssignments(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  employeeId: string
): Promise<EmployeeRepAssignment[]> {
  const { data: branches } = await service
    .from("branches")
    .select(
      "id, branch_code, branch_name, representative_1_employee_id, representative_2_employee_id"
    );

  const assignments: EmployeeRepAssignment[] = [];
  for (const branch of branches ?? []) {
    if (branch.representative_1_employee_id === employeeId) {
      assignments.push({
        branch_id: branch.id,
        branch_code: branch.branch_code,
        branch_name: branch.branch_name,
        slot: 1,
      });
    }
    if (branch.representative_2_employee_id === employeeId) {
      assignments.push({
        branch_id: branch.id,
        branch_code: branch.branch_code,
        branch_name: branch.branch_name,
        slot: 2,
      });
    }
  }

  return assignments.sort((a, b) =>
    a.branch_code.localeCompare(b.branch_code, undefined, { numeric: true })
  );
}

export async function getBranchOptionsForHris(): Promise<
  import("@/lib/employee-types").HrisBranchOption[]
> {
  const service = await createServiceClient();
  const { data, error } = await service
    .from("branches")
    .select("id, branch_code, branch_name, area")
    .eq("is_active", true)
    .order("area")
    .order("branch_name");

  if (error) throw new Error(error.message);
  return (data ?? []) as import("@/lib/employee-types").HrisBranchOption[];
}

export async function getEmployeesForAdmin(
  options: GetEmployeesForAdminOptions = {}
): Promise<EmployeeAdminRow[]> {
  const service = await createServiceClient();
  let query = service.from("employees").select(EMPLOYEE_COLUMNS).order("full_name");

  if (options.status && options.status !== "all") {
    query = query.eq("employment_status", options.status);
  }

  const { data: employees, error } = await query;
  if (error) throw new Error(error.message);

  const { data: branches } = await service
    .from("branches")
    .select(
      "id, branch_code, branch_name, representative_1_employee_id, representative_2_employee_id"
    );

  const branchById = new Map(
    (branches ?? []).map((b) => [b.id, { branch_code: b.branch_code, branch_name: b.branch_name }])
  );

  const assignmentsByEmployee = new Map<string, EmployeeRepAssignment[]>();
  for (const branch of branches ?? []) {
    if (branch.representative_1_employee_id) {
      const list = assignmentsByEmployee.get(branch.representative_1_employee_id) ?? [];
      list.push({
        branch_id: branch.id,
        branch_code: branch.branch_code,
        branch_name: branch.branch_name,
        slot: 1,
      });
      assignmentsByEmployee.set(branch.representative_1_employee_id, list);
    }
    if (branch.representative_2_employee_id) {
      const list = assignmentsByEmployee.get(branch.representative_2_employee_id) ?? [];
      list.push({
        branch_id: branch.id,
        branch_code: branch.branch_code,
        branch_name: branch.branch_name,
        slot: 2,
      });
      assignmentsByEmployee.set(branch.representative_2_employee_id, list);
    }
  }

  const search = options.search?.trim().toLowerCase();
  const branchId = options.branchId;

  return (employees ?? [])
    .map((row) => {
      const employee = row as Employee;
      const homeBranch = employee.home_branch_id
        ? branchById.get(employee.home_branch_id)
        : null;
      return {
        ...employee,
        home_branch_code: homeBranch?.branch_code ?? null,
        home_branch_name: homeBranch?.branch_name ?? null,
        rep_assignments: assignmentsByEmployee.get(employee.id) ?? [],
      };
    })
    .filter((row) => {
      if (branchId) {
        const matchesHome = row.home_branch_id === branchId;
        const matchesRep = row.rep_assignments.some((a) => a.branch_id === branchId);
        if (!matchesHome && !matchesRep) return false;
      }
      if (!search) return true;
      return (
        row.full_name.toLowerCase().includes(search) ||
        row.employee_no.toLowerCase().includes(search) ||
        (row.position?.toLowerCase().includes(search) ?? false) ||
        (row.home_branch_code?.toLowerCase().includes(search) ?? false) ||
        (row.home_branch_name?.toLowerCase().includes(search) ?? false) ||
        row.rep_assignments.some(
          (a) =>
            a.branch_code.toLowerCase().includes(search) ||
            a.branch_name.toLowerCase().includes(search)
        )
      );
    });
}

export type EmployeeProfileInput = EmployeeHrisProfileFields & {
  employee_no: string;
  full_name: string;
  position?: string;
  notes?: string;
  home_branch_id?: string | null;
};

export async function updateEmployeeProfile(
  employeeId: string,
  fields: EmployeeProfileInput
): Promise<Employee> {
  const service = await createServiceClient();
  const now = new Date().toISOString();
  const employeeNo = normalizeEmployeeNo(fields.employee_no);

  await assertEmployeeDirectoryUnique(
    { employee_no: employeeNo, full_name: fields.full_name },
    employeeId
  );

  const { data, error } = await service
    .from("employees")
    .update({
      employee_no: employeeNo,
      ...employeeWritePayload(fields),
      updated_at: now,
    })
    .eq("id", employeeId)
    .select(EMPLOYEE_COLUMNS)
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error("Employee number already exists in the directory.");
    }
    throw new Error(error?.message ?? "Failed to update employee");
  }
  return data as Employee;
}

export async function createEmployeeRecord(
  fields: EmployeeProfileInput
): Promise<Employee> {
  const service = await createServiceClient();
  const now = new Date().toISOString();

  await assertEmployeeDirectoryUnique({
    employee_no: fields.employee_no,
    full_name: fields.full_name,
  });

  const { data, error } = await service
    .from("employees")
    .insert({
      employee_no: normalizeEmployeeNo(fields.employee_no),
      ...employeeWritePayload(fields),
      employment_status: "active",
      updated_at: now,
    })
    .select(EMPLOYEE_COLUMNS)
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error("Employee number already exists in the directory.");
    }
    throw new Error(error?.message ?? "Failed to create employee");
  }
  return data as Employee;
}

export async function setEmployeeEmploymentStatus(
  employeeId: string,
  status: EmploymentStatus
): Promise<Employee> {
  const service = await createServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await service
    .from("employees")
    .update({
      employment_status: status,
      resigned_at: status === "resigned" ? now : null,
      updated_at: now,
    })
    .eq("id", employeeId)
    .select(EMPLOYEE_COLUMNS)
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to update status");
  return data as Employee;
}

/** Keep branch rep text columns in sync after an employee profile edit. */
export async function syncBranchRepTextFromEmployee(
  employeeId: string
): Promise<void> {
  const service = await createServiceClient();
  const { data: employee } = await service
    .from("employees")
    .select(EMPLOYEE_COLUMNS)
    .eq("id", employeeId)
    .maybeSingle();

  if (!employee) return;

  const emp = employee as Employee;
  const now = new Date().toISOString();

  const { data: asRep1 } = await service
    .from("branches")
    .select("id")
    .eq("representative_1_employee_id", employeeId);
  for (const branch of asRep1 ?? []) {
    await service
      .from("branches")
      .update({
        ...denormalizedRepColumns(1, emp),
        representatives_updated_at: now,
      })
      .eq("id", branch.id);
  }

  const { data: asRep2 } = await service
    .from("branches")
    .select("id")
    .eq("representative_2_employee_id", employeeId);
  for (const branch of asRep2 ?? []) {
    await service
      .from("branches")
      .update({
        ...denormalizedRepColumns(2, emp),
        representatives_updated_at: now,
      })
      .eq("id", branch.id);
  }
}

export async function findEmployeeByEmployeeNo(
  employeeNo: string
): Promise<Employee | null> {
  const service = await createServiceClient();
  return findEmployeeByEmployeeNoInService(service, employeeNo);
}

export async function getEmployeesForRepresentativePicker(): Promise<
  EmployeePickerRow[]
> {
  const service = await createServiceClient();
  const { data, error } = await service
    .from("employees")
    .select("id, employee_no, full_name, position, photo_path, employment_status")
    .order("full_name");

  if (error) throw new Error(error.message);
  return (data ?? []) as EmployeePickerRow[];
}

export async function upsertEmployeeFromDirectoryRow(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  row: import("@/lib/employees-csv").EmployeeDirectoryCsvRow,
  homeBranchId: string | null | undefined
): Promise<Employee> {
  const employeeNo = normalizeEmployeeNo(row.employee_no);
  const now = new Date().toISOString();
  const input: EmployeeProfileInput = {
    employee_no: employeeNo,
    full_name: row.full_name,
  };

  if (row.position !== undefined) input.position = row.position;
  if (row.nickname !== undefined) input.nickname = row.nickname;
  if (row.date_hired !== undefined) input.date_hired = row.date_hired;
  if (row.contact_number !== undefined) input.contact_number = row.contact_number;
  if (row.email !== undefined) input.email = row.email;
  if (homeBranchId !== undefined) input.home_branch_id = homeBranchId;

  const existing = await findEmployeeByEmployeeNoInService(service, employeeNo);

  if (existing) {
    const { data, error } = await service
      .from("employees")
      .update({
        employee_no: employeeNo,
        ...employeeWritePayload(input),
        updated_at: now,
      })
      .eq("id", existing.id)
      .select(EMPLOYEE_COLUMNS)
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to update employee profile");
    }
    return data as Employee;
  }

  const { data, error } = await service
    .from("employees")
    .insert({
      employee_no: employeeNo,
      ...employeeWritePayload(input),
      employment_status: "active",
      updated_at: now,
    })
    .select(EMPLOYEE_COLUMNS)
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error(`Employee number ${employeeNo} already exists.`);
    }
    throw new Error(error?.message ?? "Failed to create employee profile");
  }

  return data as Employee;
}

export async function importEmployeeDirectoryRows(
  rows: import("@/lib/employees-csv").EmployeeDirectoryCsvRow[]
): Promise<{ upserted: number; errors: string[] }> {
  const service = await createServiceClient();
  const { data: branches } = await service
    .from("branches")
    .select("id, branch_code");

  const codeToBranchId = new Map(
    (branches ?? []).map((b) => [b.branch_code.toLowerCase(), b.id as string])
  );

  let upserted = 0;
  const errors: string[] = [];

  for (const row of rows) {
    let homeBranchId: string | null | undefined = undefined;

    if (row.branch_code !== undefined) {
      const branchCode = row.branch_code.trim();
      if (branchCode) {
        const branchId = codeToBranchId.get(branchCode.toLowerCase());
        if (!branchId) {
          errors.push(
            `Line for ${row.full_name} (${row.employee_no}): unknown branch_code "${branchCode}"`
          );
        }
        homeBranchId = branchId ?? null;
      } else {
        homeBranchId = null;
      }
    }

    try {
      await upsertEmployeeFromDirectoryRow(service, row, homeBranchId);
      upserted++;
    } catch (e) {
      errors.push(
        `${row.full_name} (${row.employee_no}): ${
          e instanceof Error ? e.message : "Import failed"
        }`
      );
    }
  }

  return { upserted, errors };
}

export async function deleteEmployeeRecord(employeeId: string): Promise<{
  full_name: string;
  employee_no: string;
}> {
  const service = await createServiceClient();
  const { data: employee, error: fetchErr } = await service
    .from("employees")
    .select("id, full_name, employee_no, photo_path")
    .eq("id", employeeId)
    .maybeSingle();

  if (fetchErr || !employee) {
    throw new Error(fetchErr?.message ?? "Employee not found.");
  }

  const now = new Date().toISOString();
  const { data: linkedBranches } = await service
    .from("branches")
    .select("id, representative_1_employee_id, representative_2_employee_id")
    .or(
      `representative_1_employee_id.eq.${employeeId},representative_2_employee_id.eq.${employeeId}`
    );

  for (const branch of linkedBranches ?? []) {
    const patch: Record<string, string | null> = {
      representatives_updated_at: now,
    };
    if (branch.representative_1_employee_id === employeeId) {
      Object.assign(patch, {
        representative_1: null,
        representative_1_employee_no: null,
        representative_1_position: null,
        representative_1_employee_id: null,
      });
    }
    if (branch.representative_2_employee_id === employeeId) {
      Object.assign(patch, {
        representative_2: null,
        representative_2_employee_no: null,
        representative_2_position: null,
        representative_2_employee_id: null,
      });
    }
    await service.from("branches").update(patch).eq("id", branch.id);
  }

  await service.storage
    .from("employee-photos")
    .remove([
      `${employeeId}.png`,
      `${employeeId}.jpg`,
      `${employeeId}.webp`,
      ...(employee.photo_path ? [employee.photo_path] : []),
    ]);

  const { error } = await service.from("employees").delete().eq("id", employeeId);
  if (error) throw new Error(error.message);

  return {
    full_name: employee.full_name,
    employee_no: employee.employee_no,
  };
}
