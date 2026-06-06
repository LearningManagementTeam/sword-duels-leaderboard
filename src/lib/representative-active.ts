import type { EmploymentStatus } from "./employee-types";
import type { BranchRepresentativeFields } from "./representative-fields";

export type ActiveRepresentativeSlot = 1 | 2;

export interface ActiveRepresentativeProfile {
  name: string | null;
  employeeNo: string | null;
  position: string | null;
  employmentStatus?: EmploymentStatus | null;
}

export interface RepScoreSnapshot {
  active_employee_id?: string | null;
  active_employee_name?: string | null;
  active_employee_no?: string | null;
  active_employee_position?: string | null;
  active_employee_status?: EmploymentStatus | null;
}

export interface BranchRepEmployeeFields {
  representative_1_employment_status?: EmploymentStatus | null;
  representative_2_employment_status?: EmploymentStatus | null;
}

export function normalizeActiveRepresentative(
  value: number | null | undefined
): ActiveRepresentativeSlot {
  return value === 2 ? 2 : 1;
}

/** Name shown on brackets / standings for the rep who competed in a set. */
export function resolveActiveRepresentativeName(
  fields: BranchRepresentativeFields,
  slot: number | null | undefined,
  snapshot?: RepScoreSnapshot | null
): string | null {
  if (snapshot?.active_employee_name?.trim()) {
    return snapshot.active_employee_name.trim();
  }
  const active = normalizeActiveRepresentative(slot);
  const primary = fields.representative_1?.trim();
  const secondary = fields.representative_2?.trim();
  if (active === 2) return secondary || primary || null;
  return primary || secondary || null;
}

/** Employee no. + position for the rep who competed in a set. */
export function resolveActiveRepresentativeProfile(
  fields: BranchRepresentativeFields & BranchRepEmployeeFields,
  slot: number | null | undefined,
  snapshot?: RepScoreSnapshot | null
): ActiveRepresentativeProfile {
  if (snapshot?.active_employee_id) {
    return {
      name: snapshot.active_employee_name?.trim() || null,
      employeeNo: snapshot.active_employee_no?.trim() || null,
      position: snapshot.active_employee_position?.trim() || null,
      employmentStatus: snapshot.active_employee_status ?? null,
    };
  }

  const active = normalizeActiveRepresentative(slot);
  if (active === 2) {
    return {
      name: fields.representative_2?.trim() || fields.representative_1?.trim() || null,
      employeeNo: fields.representative_2_employee_no?.trim() || null,
      position: fields.representative_2_position?.trim() || null,
      employmentStatus: fields.representative_2_employment_status ?? null,
    };
  }
  return {
    name: fields.representative_1?.trim() || fields.representative_2?.trim() || null,
    employeeNo: fields.representative_1_employee_no?.trim() || null,
    position: fields.representative_1_position?.trim() || null,
    employmentStatus: fields.representative_1_employment_status ?? null,
  };
}
