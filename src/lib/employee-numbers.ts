export const PENDING_EMPLOYEE_NO_PREFIX = "PENDING-";
export const LEGACY_EMPLOYEE_NO_PREFIX = "LEGACY-";

/** Shown in admin UI instead of raw PENDING-* / LEGACY-* storage values. */
export const EMPLOYEE_NO_PENDING_LABEL = "Pending ID";

export function legacyEmployeeNo(branchCode: string, slot: 1 | 2): string {
  return `LEGACY-${branchCode.trim()}-${slot}`;
}

export function isProvisionalEmployeeNo(employeeNo: string): boolean {
  const trimmed = employeeNo.trim();
  return (
    trimmed.startsWith(PENDING_EMPLOYEE_NO_PREFIX) ||
    trimmed.startsWith(LEGACY_EMPLOYEE_NO_PREFIX)
  );
}

/** Admin-facing label; provisional rows show a status placeholder. */
export function formatEmployeeNoDisplay(employeeNo: string): string {
  return isProvisionalEmployeeNo(employeeNo)
    ? EMPLOYEE_NO_PENDING_LABEL
    : employeeNo.trim();
}

export function normalizeEmployeeNo(value: string): string {
  return value.trim();
}

export function resolveEmployeeNoForSave(
  employeeNo: string,
  context: {
    fullName: string;
    branchCode?: string | null;
    existingEmployeeNo?: string | null;
  }
): string {
  const trimmed = normalizeEmployeeNo(employeeNo);
  if (trimmed) return trimmed;

  const existing = context.existingEmployeeNo?.trim();
  if (existing && isProvisionalEmployeeNo(existing)) {
    return existing;
  }

  return provisionalEmployeeNo(context.fullName, {
    branchCode: context.branchCode?.trim() || undefined,
  });
}

/** Placeholder employee no. when HR id is not yet available. */
export function provisionalEmployeeNo(
  fullName: string,
  options?: { branchCode?: string; slot?: 1 | 2 }
): string {
  if (options?.branchCode?.trim() && options?.slot) {
    return legacyEmployeeNo(options.branchCode, options.slot);
  }

  const branch = options?.branchCode?.trim() || "UNK";
  const slug = fullName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

  return `PENDING-${branch}-${slug || "EMPLOYEE"}`;
}
