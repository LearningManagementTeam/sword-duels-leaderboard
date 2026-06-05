import type { BranchRepresentativeFields } from "./representative-fields";

export type ActiveRepresentativeSlot = 1 | 2;

export function normalizeActiveRepresentative(
  value: number | null | undefined
): ActiveRepresentativeSlot {
  return value === 2 ? 2 : 1;
}

/** Name shown on brackets / standings for the rep who competed in a set. */
export function resolveActiveRepresentativeName(
  fields: BranchRepresentativeFields,
  slot: number | null | undefined
): string | null {
  const active = normalizeActiveRepresentative(slot);
  const primary = fields.representative_1?.trim();
  const secondary = fields.representative_2?.trim();
  if (active === 2) return secondary || primary || null;
  return primary || secondary || null;
}

export interface ActiveRepresentativeProfile {
  name: string | null;
  employeeNo: string | null;
  position: string | null;
}

/** Employee no. + position for the rep who competed in a set. */
export function resolveActiveRepresentativeProfile(
  fields: BranchRepresentativeFields,
  slot: number | null | undefined
): ActiveRepresentativeProfile {
  const active = normalizeActiveRepresentative(slot);
  if (active === 2) {
    return {
      name: fields.representative_2?.trim() || fields.representative_1?.trim() || null,
      employeeNo: fields.representative_2_employee_no?.trim() || null,
      position: fields.representative_2_position?.trim() || null,
    };
  }
  return {
    name: fields.representative_1?.trim() || fields.representative_2?.trim() || null,
    employeeNo: fields.representative_1_employee_no?.trim() || null,
    position: fields.representative_1_position?.trim() || null,
  };
}
