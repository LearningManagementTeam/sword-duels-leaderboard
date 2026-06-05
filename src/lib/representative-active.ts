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
