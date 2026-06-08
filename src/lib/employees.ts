import type {
  Employee,
  EmployeeAdminRow,
  EmployeeRepAssignment,
  EmploymentStatus,
} from "@/lib/employee-types";
import type { RepresentativeSavePayload } from "@/lib/representative-fields";
import { createServiceClient } from "@/lib/supabase/server";
import { normalizeAllCapsText } from "@/lib/text-format";

export type {
  Employee,
  EmployeeAdminRow,
  EmployeeRepAssignment,
  EmploymentStatus,
} from "@/lib/employee-types";
export { employmentStatusLabel } from "@/lib/employee-types";

export interface RepSlotInput {
  full_name: string;
  employee_no: string;
  position: string;
}

const EMPLOYEE_COLUMNS =
  "id, employee_no, full_name, position, employment_status, resigned_at, notes, photo_path, created_at, updated_at";

export function normalizeEmployeeNo(value: string): string {
  return value.trim();
}

export function legacyEmployeeNo(branchCode: string, slot: 1 | 2): string {
  return `LEGACY-${branchCode.trim()}-${slot}`;
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

  return {
    full_name: fullName || no,
    employee_no: no || legacyEmployeeNo(branchCode, slot),
    position: position?.trim() ?? "",
  };
}

export async function upsertEmployeeFromRepSlot(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  input: RepSlotInput
): Promise<Employee> {
  const employeeNo = normalizeEmployeeNo(input.employee_no);
  const now = new Date().toISOString();

  const { data: existing } = await service
    .from("employees")
    .select(EMPLOYEE_COLUMNS)
    .eq("employee_no", employeeNo)
    .maybeSingle();

  if (existing) {
    const { data, error } = await service
      .from("employees")
      .update({
        full_name: normalizeAllCapsText(input.full_name.trim()),
        position: normalizeAllCapsText(input.position.trim()) || null,
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
      full_name: normalizeAllCapsText(input.full_name.trim()),
      position: normalizeAllCapsText(input.position.trim()) || null,
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

export async function linkBranchRepresentatives(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  branchId: string,
  branchCode: string,
  slots: { slot1: RepSlotInput | null; slot2: RepSlotInput | null },
  updatedAt?: string
): Promise<void> {
  const now = updatedAt ?? new Date().toISOString();

  const emp1 = slots.slot1
    ? await upsertEmployeeFromRepSlot(service, slots.slot1)
    : null;
  const emp2 = slots.slot2
    ? await upsertEmployeeFromRepSlot(service, slots.slot2)
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
    };
  });
}

export interface GetEmployeesForAdminOptions {
  search?: string;
  status?: EmploymentStatus | "all";
  branchId?: string;
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
      return {
        ...employee,
        rep_assignments: assignmentsByEmployee.get(employee.id) ?? [],
      };
    })
    .filter((row) => {
      if (branchId && !row.rep_assignments.some((a) => a.branch_id === branchId)) {
        return false;
      }
      if (!search) return true;
      return (
        row.full_name.toLowerCase().includes(search) ||
        row.employee_no.toLowerCase().includes(search) ||
        (row.position?.toLowerCase().includes(search) ?? false) ||
        row.rep_assignments.some(
          (a) =>
            a.branch_code.toLowerCase().includes(search) ||
            a.branch_name.toLowerCase().includes(search)
        )
      );
    });
}

export async function updateEmployeeProfile(
  employeeId: string,
  fields: {
    employee_no: string;
    full_name: string;
    position: string;
    notes?: string;
  }
): Promise<Employee> {
  const service = await createServiceClient();
  const now = new Date().toISOString();
  const employeeNo = normalizeEmployeeNo(fields.employee_no);

  const { data, error } = await service
    .from("employees")
    .update({
      employee_no: employeeNo,
      full_name: normalizeAllCapsText(fields.full_name.trim()),
      position:
        normalizeAllCapsText(fields.position.trim()) || null,
      notes: fields.notes?.trim()
        ? normalizeAllCapsText(fields.notes.trim()) || null
        : null,
      updated_at: now,
    })
    .eq("id", employeeId)
    .select(EMPLOYEE_COLUMNS)
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to update employee");
  return data as Employee;
}

export async function createEmployeeRecord(fields: {
  employee_no: string;
  full_name: string;
  position?: string;
  notes?: string;
}): Promise<Employee> {
  const service = await createServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await service
    .from("employees")
    .insert({
      employee_no: normalizeEmployeeNo(fields.employee_no),
      full_name: normalizeAllCapsText(fields.full_name.trim()),
      position: fields.position?.trim()
        ? normalizeAllCapsText(fields.position.trim()) || null
        : null,
      notes: fields.notes?.trim()
        ? normalizeAllCapsText(fields.notes.trim()) || null
        : null,
      employment_status: "active",
      updated_at: now,
    })
    .select(EMPLOYEE_COLUMNS)
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create employee");
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
  const { data } = await service
    .from("employees")
    .select(EMPLOYEE_COLUMNS)
    .eq("employee_no", normalizeEmployeeNo(employeeNo))
    .maybeSingle();

  return (data as Employee) ?? null;
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
